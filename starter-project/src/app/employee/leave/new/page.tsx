import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { todayIso } from "@/lib/constants";
import { PageHeader } from "@/components/ui/PageHeader";
import { LeaveRequestForm } from "@/components/LeaveRequestForm";
import { EmptyState } from "@/components/ui/EmptyState";

// The apply screen (design §12). The supervisor dropdown offers only
// supervisors from the employee's own division (Part A §5, rule 2).
export default async function NewLeavePage() {
  const user = await requireRole("EMPLOYEE");

  const supervisors = await prisma.user.findMany({
    where: { role: "SUPERVISOR", division: user.division },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  if (supervisors.length === 0) {
    return (
      <>
        <PageHeader title="Apply for leave" />
        <EmptyState
          title="No supervisor in your division"
          description="Ask HR to add a supervisor for your division first."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Apply for leave"
        description="Pick a type, your supervisor and the dates. The reason is optional."
      />
      <LeaveRequestForm supervisors={supervisors} today={todayIso()} />
    </>
  );
}
