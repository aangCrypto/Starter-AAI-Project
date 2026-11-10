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

// Supervisor decision screen (design §12): only the requests that named them.
// Sign or reject (remark required on reject); after a decision the screen is
// read-only. A request not named to them goes back to /supervisor.
export default async function SupervisorLeaveDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("SUPERVISOR");
  const { id } = await params;
  const requestId = Number(id);
  if (!Number.isInteger(requestId)) redirect("/supervisor");

  const request = await prisma.leaveRequest.findUnique({
    where: { id: requestId },
    include: {
      employee: { select: { name: true } },
      supervisor: { select: { name: true } },
      hrDecidedBy: { select: { name: true } },
    },
  });
  if (!request || request.supervisorId !== user.id) redirect("/supervisor");

  const actions: DecisionAction[] = [];
  if (request.status === "AWAITING_SUPERVISOR") {
    actions.push({
      kind: "sign",
      label: "Sign",
      variant: "success",
      confirmTitle: "Sign this request?",
      confirmMessage: "The employee can then send it to HR for the final decision.",
      needsRemark: true,
    });
    actions.push({
      kind: "supervisorReject",
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
          redirectTo="/supervisor"
        />
      </Card>
    </>
  );
}
