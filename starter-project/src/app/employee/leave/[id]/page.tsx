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

// Employee detail screen (design §12): own request only — anything else goes
// back to /employee. Send to HR when Signed, Withdraw when Awaiting supervisor.
export default async function EmployeeLeaveDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("EMPLOYEE");
  const { id } = await params;
  const requestId = Number(id);
  if (!Number.isInteger(requestId)) redirect("/employee");

  const request = await prisma.leaveRequest.findUnique({
    where: { id: requestId },
    include: {
      employee: { select: { name: true } },
      supervisor: { select: { name: true } },
      hrDecidedBy: { select: { name: true } },
    },
  });
  if (!request || request.employeeId !== user.id) redirect("/employee");

  const actions: DecisionAction[] = [];
  if (request.status === "SIGNED") {
    actions.push({
      kind: "send",
      label: "Send to HR",
      confirmTitle: "Send this request to HR?",
      confirmMessage: "An HR officer will make the final decision.",
    });
  }
  if (request.status === "AWAITING_SUPERVISOR") {
    actions.push({
      kind: "withdraw",
      label: "Withdraw",
      danger: true,
      confirmTitle: "Withdraw this request?",
      confirmMessage: "You can submit a new one if the details were wrong.",
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
          redirectTo="/employee"
        />
      </Card>
    </>
  );
}
