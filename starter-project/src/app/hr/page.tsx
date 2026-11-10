import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { LeaveHomeSections } from "@/components/LeaveHomeSections";
import { toLeaveRequestRow } from "@/components/LeaveRequestTable";

// HR home (design §12): the shared queue — every Awaiting HR request, the
// same list for both HR officers.
export default async function HRPage() {
  await requireRole("HR");

  const requests = await prisma.leaveRequest.findMany({
    include: { employee: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });
  const rows = requests.map(toLeaveRequestRow);
  const actionNeeded = rows.filter((r) => r.status === "AWAITING_HR");
  const history = rows.filter((r) => r.status !== "AWAITING_HR");

  return (
    <>
      <PageHeader
        title="HR queue"
        description="Every request waiting for a final decision. Either HR officer may decide."
      />
      <LeaveHomeSections
        actionRows={actionNeeded}
        historyRows={history}
        rowHref={(r) => `/hr/leave/${r.id}`}
      />
    </>
  );
}
