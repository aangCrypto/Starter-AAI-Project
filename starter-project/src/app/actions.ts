"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getCurrentUser, startSession, endSession, roleHome } from "@/lib/auth";
import { isLeaveType, todayIso, type Role } from "@/lib/constants";
import {
  canTransition,
  daysInclusive,
  rangesOverlap,
  validateLeaveDates,
  OVERLAP_BLOCKING_STATUSES,
} from "@/lib/leave";
import type { LeaveStatus } from "@/lib/constants";

// Server actions: functions that run on the server when a button is pressed.
// Every leave action re-checks the role, the ownership and the current status
// — showing a button is never enough (design §10).

export type ActionResult = { error?: string; ok?: boolean; message?: string };

const LEAVE_HOME_PATHS = ["/employee", "/supervisor", "/hr", "/admin"] as const;

function revalidateLeavePages() {
  for (const path of LEAVE_HOME_PATHS) revalidatePath(path);
}

function notAuthorized(): ActionResult {
  return { error: "You are not allowed to do that." };
}

export async function loginAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Please enter your email and password." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Invalid email or password." };
  }

  await startSession(user);
  // The sidebar frame lives in the root layout; without this the client can
  // reuse the cached logged-out layout and land on the dashboard with no frame.
  revalidatePath("/", "layout");
  redirect(roleHome(user.role as Role));
}

export async function logoutAction(): Promise<void> {
  await endSession();
  // The sidebar frame lives in the root layout; without this the client can
  // reuse the cached logged-in layout and show the frame around the login page.
  revalidatePath("/", "layout");
  redirect("/login");
}

// ---------------------------------------------------------------------------
// Leave Request actions (design Part A §4–5)
// ---------------------------------------------------------------------------

// Employee submits a new request: type, own-division supervisor, dates,
// optional reason. Days are computed here, never typed (rule 3).
export async function applyForLeaveAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "EMPLOYEE") return notAuthorized();

  const leaveType = String(formData.get("leaveType") ?? "");
  const supervisorId = Number(formData.get("supervisorId"));
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;

  if (!isLeaveType(leaveType)) return { error: "Please choose a leave type." };
  if (!Number.isInteger(supervisorId) || supervisorId <= 0) {
    return { error: "Please choose your supervisor." };
  }
  const dateError = validateLeaveDates(startDate, endDate, todayIso());
  if (dateError) return { error: dateError };

  const supervisor = await prisma.user.findUnique({ where: { id: supervisorId } });
  if (!supervisor || supervisor.role !== "SUPERVISOR" || supervisor.division !== user.division) {
    return { error: "Please choose a supervisor from your own division." };
  }

  // Stretch U16: block ranges that clash with the employee's own active or
  // approved requests; the error names the clashing request.
  const own = await prisma.leaveRequest.findMany({
    where: { employeeId: user.id, status: { in: OVERLAP_BLOCKING_STATUSES } },
  });
  const clash = own.find((r) =>
    rangesOverlap(startDate, endDate, isoDate(r.startDate), isoDate(r.endDate)),
  );
  if (clash) {
    return {
      error: `This range overlaps your existing ${clash.leaveType.toLowerCase()} request for ${isoDate(clash.startDate)} – ${isoDate(clash.endDate)}.`,
    };
  }

  await prisma.leaveRequest.create({
    data: {
      employeeId: user.id,
      supervisorId,
      leaveType,
      startDate: new Date(`${startDate}T00:00:00Z`),
      endDate: new Date(`${endDate}T00:00:00Z`),
      days: daysInclusive(startDate, endDate),
      reason,
      status: "AWAITING_SUPERVISOR",
    },
  });

  revalidateLeavePages();
  return { ok: true, message: "Your leave request was submitted." };
}

// A YYYY-MM-DD string from a stored Date (UTC-safe, matches how the app
// displays dates).
function isoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

// One shared shape for the four "decide or move" actions: find the request,
// check who may act on which status, then move it if the transition is allowed.
async function moveRequest(
  id: unknown,
  checks: {
    role?: Role;
    employee?: boolean;
    supervisor?: boolean;
    hr?: boolean;
    from: LeaveStatus;
    to: LeaveStatus;
  },
  extra: { supervisorRemark?: string | null; hrRemark?: string | null; hrDecidedById?: number } = {},
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return notAuthorized();
  if (checks.role && user.role !== checks.role) return notAuthorized();

  const requestId = Number(id);
  if (!Number.isInteger(requestId) || requestId <= 0) return notAuthorized();

  const request = await prisma.leaveRequest.findUnique({ where: { id: requestId } });
  if (!request) return { error: "Request not found." };
  if (checks.employee && request.employeeId !== user.id) return notAuthorized();
  if (checks.supervisor && request.supervisorId !== user.id) return notAuthorized();
  if (!checks.employee && !checks.supervisor && !checks.hr && checks.role !== "ADMIN") {
    return notAuthorized();
  }
  if (request.status !== checks.from || !canTransition(request.status, checks.to)) {
    return { error: "This request can no longer be changed." };
  }

  await prisma.leaveRequest.update({
    where: { id: requestId },
    data: { status: checks.to, ...extra },
  });
  // No revalidatePath here on purpose: it remounts the detail page the moment
  // the action returns, which unmounts the success modal before the user can
  // read it (AC-18). The buttons component navigates to a fresh page and
  // calls router.refresh() after the modal is dismissed instead.
  return { ok: true };
}

// Employee withdraws their own request, only before the supervisor decides.
export async function withdrawAction(id: number): Promise<ActionResult> {
  const result = await moveRequest(id, {
    role: "EMPLOYEE",
    employee: true,
    from: "AWAITING_SUPERVISOR",
    to: "WITHDRAWN",
  });
  return result.ok ? { ok: true, message: "Your request was withdrawn." } : result;
}

// Employee sends their own signed request to the shared HR queue.
export async function sendToHrAction(id: number): Promise<ActionResult> {
  const result = await moveRequest(id, {
    role: "EMPLOYEE",
    employee: true,
    from: "SIGNED",
    to: "AWAITING_HR",
  });
  return result.ok ? { ok: true, message: "Your request was sent to HR." } : result;
}

// The chosen supervisor signs the request (optional remark).
export async function signAction(id: number, remark?: string): Promise<ActionResult> {
  const result = await moveRequest(
    id,
    { role: "SUPERVISOR", supervisor: true, from: "AWAITING_SUPERVISOR", to: "SIGNED" },
    { supervisorRemark: remark?.trim() || null },
  );
  return result.ok ? { ok: true, message: "You signed the request." } : result;
}

// The chosen supervisor rejects — the remark is required (rule 5).
export async function supervisorRejectAction(
  id: number,
  remark?: string,
): Promise<ActionResult> {
  const text = remark?.trim();
  if (!text) return { error: "A remark is required when rejecting." };
  const result = await moveRequest(
    id,
    { role: "SUPERVISOR", supervisor: true, from: "AWAITING_SUPERVISOR", to: "REJECTED" },
    { supervisorRemark: text },
  );
  return result.ok ? { ok: true, message: "You rejected the request." } : result;
}

// Any HR officer approves; the deciding officer is recorded (rule: §4).
export async function approveAction(id: number, remark?: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "HR") return notAuthorized();
  const result = await moveRequest(
    id,
    { role: "HR", hr: true, from: "AWAITING_HR", to: "APPROVED" },
    { hrRemark: remark?.trim() || null, hrDecidedById: user.id },
  );
  return result.ok ? { ok: true, message: "You approved the request." } : result;
}

// Any HR officer rejects — the remark is required, the decider is recorded.
export async function hrRejectAction(id: number, remark?: string): Promise<ActionResult> {
  const text = remark?.trim();
  if (!text) return { error: "A remark is required when rejecting." };
  const user = await getCurrentUser();
  if (!user || user.role !== "HR") return notAuthorized();
  const result = await moveRequest(
    id,
    { role: "HR", hr: true, from: "AWAITING_HR", to: "REJECTED" },
    { hrRemark: text, hrDecidedById: user.id },
  );
  return result.ok ? { ok: true, message: "You rejected the request." } : result;
}
