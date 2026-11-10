import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// The demo users (design §9). Every one logs in with the password "password123".
// Each name includes the user's division in brackets.
const USERS = [
  { email: "employee-1@budiman.com", name: "Employee 1 (Finance & Administration)", role: "EMPLOYEE", identificationNo: "00-148291", designation: "Administrative Officer", division: "Finance & Administration" },
  { email: "employee-2@budiman.com", name: "Employee 2 (Software Development)", role: "EMPLOYEE", identificationNo: "00-173604", designation: "Software Engineer", division: "Software Development" },
  { email: "supervisor-1@budiman.com", name: "Supervisor 1 (Finance & Administration)", role: "SUPERVISOR", identificationNo: "00-159827", designation: "Team Lead", division: "Finance & Administration" },
  { email: "supervisor-2@budiman.com", name: "Supervisor 2 (Software Development)", role: "SUPERVISOR", identificationNo: "00-126418", designation: "Team Lead", division: "Software Development" },
  { email: "hr-1@budiman.com", name: "HR 1 (Human Resources)", role: "HR", identificationNo: "00-191356", designation: "HR Officer", division: "Human Resources" },
  { email: "hr-2@budiman.com", name: "HR 2 (Human Resources)", role: "HR", identificationNo: "00-184072", designation: "HR Officer", division: "Human Resources" },
  { email: "admin@budiman.com", name: "Admin (Management)", role: "ADMIN", identificationNo: "00-105739", designation: "Director", division: "Management" },
];

// The demo requests (design §14): one per status, all dated January 2026 so
// they never clash with the dates used by the acceptance checks. `days` is
// the inclusive calendar-day count, as the app would compute it on submit.
type SeedRequest = {
  employee: string;
  supervisor: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
  reason?: string;
  supervisorRemark?: string;
  hrRemark?: string;
  hrDecidedBy?: string;
};

const REQUESTS: SeedRequest[] = [
  { employee: "employee-1@budiman.com", supervisor: "supervisor-1@budiman.com", leaveType: "ANNUAL", startDate: "2026-01-12", endDate: "2026-01-14", days: 3, status: "AWAITING_SUPERVISOR", reason: "Family visit out of town." },
  { employee: "employee-2@budiman.com", supervisor: "supervisor-2@budiman.com", leaveType: "SICK", startDate: "2026-01-05", endDate: "2026-01-06", days: 2, status: "SIGNED" },
  { employee: "employee-1@budiman.com", supervisor: "supervisor-1@budiman.com", leaveType: "EMERGENCY", startDate: "2026-01-08", endDate: "2026-01-08", days: 1, status: "AWAITING_HR" },
  { employee: "employee-2@budiman.com", supervisor: "supervisor-2@budiman.com", leaveType: "ANNUAL", startDate: "2026-01-19", endDate: "2026-01-23", days: 5, status: "APPROVED", hrDecidedBy: "hr-1@budiman.com" },
  { employee: "employee-1@budiman.com", supervisor: "supervisor-1@budiman.com", leaveType: "SICK", startDate: "2026-01-26", endDate: "2026-01-27", days: 2, status: "REJECTED", supervisorRemark: "Team busy that week" },
  { employee: "employee-2@budiman.com", supervisor: "supervisor-2@budiman.com", leaveType: "EMERGENCY", startDate: "2026-01-02", endDate: "2026-01-02", days: 1, status: "WITHDRAWN" },
];

async function main() {
  // Reset the data so the seed is repeatable. Requests reference users,
  // so they must go first.
  await prisma.leaveRequest.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);
  const users: Record<string, { id: number }> = {};
  for (const user of USERS) {
    users[user.email] = await prisma.user.create({ data: { ...user, passwordHash } });
  }

  for (const r of REQUESTS) {
    await prisma.leaveRequest.create({
      data: {
        employeeId: users[r.employee].id,
        supervisorId: users[r.supervisor].id,
        leaveType: r.leaveType,
        startDate: new Date(r.startDate),
        endDate: new Date(r.endDate),
        days: r.days,
        reason: r.reason ?? null,
        status: r.status,
        supervisorRemark: r.supervisorRemark ?? null,
        hrRemark: r.hrRemark ?? null,
        hrDecidedById: r.hrDecidedBy ? users[r.hrDecidedBy].id : null,
      },
    });
  }

  console.log(`Seeded ${USERS.length} demo users (password: password123):`);
  for (const user of USERS) console.log(`  ${user.email.padEnd(26)} ${user.role}`);
  console.log(`Seeded ${REQUESTS.length} demo requests (all January 2026):`);
  for (const r of REQUESTS) {
    const from = r.employee.split("@")[0].padEnd(12);
    const to = r.supervisor.split("@")[0].padEnd(13);
    const decider = r.hrDecidedBy ? `  decided by ${r.hrDecidedBy.split("@")[0]}` : "";
    console.log(`  ${from} -> ${to} ${r.leaveType.padEnd(10)} ${r.startDate}..${r.endDate} (${r.days}d)  ${r.status}${decider}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
