import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { LeaveRequestDetail } from "@/components/LeaveRequestDetail";
import {
  LeaveDecisionButtons,
  type DecisionAction,
} from "@/components/LeaveDecisionButtons";

// HR decision screen (design §12): either HR officer may decide a request in
// the shared queue; the officer who acts is recorded. After a decision the
// screen is read-only and shows who decided.
export default async function HrLeaveDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("HR");
  const { id } = await params;
  const requestId = Number(id);
  if (!Number.isInteger(requestId)) redirect("/hr");

  const request = await prisma.leaveRequest.findUnique({
    where: { id: requestId },
    include: {
      employee: { select: { name: true } },
      supervisor: { select: { name: true } },
      hrDecidedBy: { select: { name: true } },
    },
  });
  if (!request) redirect("/hr");

  const actions: DecisionAction[] = [];
  if (request.status === "AWAITING_HR") {
    actions.push({
      kind: "approve",
      label: "Approve",
      variant: "success",
      confirmTitle: "Approve this request?",
      confirmMessage: "This is the final decision — the leave is granted.",
      needsRemark: true,
    });
    actions.push({
      kind: "hrReject",
      label: "Reject",
      danger: true,
      confirmTitle: "Reject this request?",
      confirmMessage: "The employee will see your remark, so explain why.",
      needsRemark: true,
      remarkRequired: true,
    });
  }

  return (
    <>
      <PageHeader title={`Leave request #${request.id}`} />
      <Card className="space-y-6 p-6">
        <LeaveRequestDetail
          request={{
            employeeName: request.employee.name,
            supervisorName: request.supervisor.name,
            leaveType: request.leaveType,
            startDate: request.startDate,
            endDate: request.endDate,
            days: request.days,
            status: request.status,
            reason: request.reason,
            supervisorRemark: request.supervisorRemark,
            hrRemark: request.hrRemark,
            hrDecidedByName: request.hrDecidedBy?.name ?? null,
          }}
        />
        <LeaveDecisionButtons
          requestId={request.id}
          actions={actions}
          redirectTo="/hr"
        />
      </Card>
    </>
  );
}
