// Plain helpers for the Leave Request module — no database here.
// Statuses and their allowed moves mirror docs/specs/02-design.md Part A §4.

import { LEAVE_STATUSES, type LeaveStatus } from "./constants";

// Calendar days, inclusive: 2026-12-03 to 2026-12-05 = 3 days.
// Dates are YYYY-MM-DD strings; returns 0 for anything unparseable.
export function daysInclusive(startIso: string, endIso: string): number {
  const start = Date.parse(`${startIso}T00:00:00Z`);
  const end = Date.parse(`${endIso}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.round((end - start) / 86_400_000) + 1;
}

// Checks the two dates on an apply form against the rules (design Part A §5,
// rule 3). `todayIso` is the company's today (Asia/Brunei). Returns an error
// message, or null when the dates are valid.
export function validateLeaveDates(
  startIso: string,
  endIso: string,
  todayIso: string,
): string | null {
  if (!startIso || !endIso) return "Please choose both a start and an end date.";
  if (Number.isNaN(Date.parse(`${startIso}T00:00:00Z`)) ||
      Number.isNaN(Date.parse(`${endIso}T00:00:00Z`))) {
    return "Please choose real dates for the start and end.";
  }
  if (startIso < todayIso) return "The start date cannot be in the past.";
  if (endIso < startIso) return "The end date cannot be before the start date.";
  return null;
}

// The only status changes the workflow allows (design Part A §4). Anything
// else is refused.
const ALLOWED_TRANSITIONS: Record<LeaveStatus, LeaveStatus[]> = {
  AWAITING_SUPERVISOR: ["SIGNED", "REJECTED", "WITHDRAWN"],
  SIGNED: ["AWAITING_HR"],
  AWAITING_HR: ["APPROVED", "REJECTED"],
  APPROVED: [],
  REJECTED: [],
  WITHDRAWN: [],
};

export function canTransition(from: string, to: string): boolean {
  if (!isStatus(from) || !isStatus(to)) return false;
  return ALLOWED_TRANSITIONS[from].includes(to);
}

function isStatus(value: string): value is LeaveStatus {
  return (LEAVE_STATUSES as readonly string[]).includes(value);
}

// True when two YYYY-MM-DD ranges share at least one day.
export function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return aStart <= bEnd && aEnd >= bStart;
}

// Statuses that still "hold" the days for the overlap rule (Part A §5, rule 8):
// still in the workflow, or already approved.
export const OVERLAP_BLOCKING_STATUSES: LeaveStatus[] = [
  "AWAITING_SUPERVISOR",
  "SIGNED",
  "AWAITING_HR",
  "APPROVED",
];
