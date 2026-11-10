import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { buttonClasses } from "@/components/ui/Button";
import { LeaveHomeSections } from "@/components/LeaveHomeSections";
import { toLeaveRequestRow } from "@/components/LeaveRequestTable";

// Employee home (design §12): requests waiting on the employee (send to HR,
// withdraw) and their history.
export default async function EmployeePage() {
  const user = await requireRole("EMPLOYEE");

  const requests = await prisma.leaveRequest.findMany({
    where: { employeeId: user.id },
    include: { employee: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });
  const rows = requests.map(toLeaveRequestRow);
  const actionNeeded = rows.filter(
    (r) => r.status === "SIGNED" || r.status === "AWAITING_SUPERVISOR",
  );
  const history = rows.filter(
    (r) => r.status !== "SIGNED" && r.status !== "AWAITING_SUPERVISOR",
  );

  return (
    <>
      <PageHeader
        title="My leave"
        description="Apply for leave and follow your requests."
        action={
          <Link href="/employee/leave/new" className={buttonClasses()}>
            Apply for leave
          </Link>
        }
      />
      <LeaveHomeSections
        actionRows={actionNeeded}
        historyRows={history}
        rowHref={(r) => `/employee/leave/${r.id}`}
      />
    </>
  );
}
