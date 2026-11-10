import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { LeaveRequestTable, toLeaveRequestRow } from "@/components/LeaveRequestTable";

// Admin home (design §12): every request in the system, view only — no
// buttons, links or actions anywhere (Part A §5, rule 7).
export default async function AdminPage() {
  await requireRole("ADMIN");

  const requests = await prisma.leaveRequest.findMany({
    include: {
      employee: { select: { name: true } },
      hrDecidedBy: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <>
      <PageHeader
        title="All leave requests"
        description="Every leave record in the system. View only."
      />
      <Card>
        <CardHeader
          title="Requests"
          count={requests.length}
          description="From every employee, supervisor and HR decision."
        />
        <LeaveRequestTable rows={requests.map(toLeaveRequestRow)} showDecider />
      </Card>
    </>
  );
}
