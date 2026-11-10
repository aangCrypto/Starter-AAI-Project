import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { LeaveHomeSections } from "@/components/LeaveHomeSections";
import { toLeaveRequestRow } from "@/components/LeaveRequestTable";

// Supervisor home (design §12): only the requests that named them.
export default async function SupervisorPage() {
  const user = await requireRole("SUPERVISOR");

  const requests = await prisma.leaveRequest.findMany({
    where: { supervisorId: user.id },
    include: { employee: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });
  const rows = requests.map(toLeaveRequestRow);
  const actionNeeded = rows.filter((r) => r.status === "AWAITING_SUPERVISOR");
  const history = rows.filter((r) => r.status !== "AWAITING_SUPERVISOR");

  return (
    <>
      <PageHeader
        title="Requests for me"
        description="Sign or reject the requests your employees sent to you."
      />
      <LeaveHomeSections
        actionRows={actionNeeded}
        historyRows={history}
        rowHref={(r) => `/supervisor/leave/${r.id}`}
      />
    </>
  );
}
