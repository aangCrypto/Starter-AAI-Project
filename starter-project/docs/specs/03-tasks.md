# Login – Tasks

> **In what order, and how to check.** Build one task at a time, in order.
> After each task: the AI builds it → a reviewer agent tests it → **you check it
> in the browser**.
>
> If a check fails, **fix the spec first** (requirements or design), then ask
> the AI to rebuild. The requirements and design are the source of truth.
>
> Tasks 1–6 are **already done** in the starter app – they show what a task
> list looks like. Tasks 7–15 are the Session 2 **Leave Request module**,
> added after Task 6, built the same way: Core first, one task at a time.

**Core and Stretch.** **Core** tasks must be finished first: the app is not
usable without them. **Stretch** tasks are nice extras. Do them only if time is
left, and only if you ask for them. All the login tasks are Core, because login
has to work before anything else.

**Before you start:** `npm install`, then `cp .env.example .env`
(Windows: `copy .env.example .env`).

| # | Task | Core / Stretch | Checks (from requirements §4) |
|---|------|----------------|-------------------------------|
| 1 | Set up the app | Core | – |
| 2 | Database table and demo users | Core | – |
| 3 | Log in and log out | Core | AC-01, AC-02, AC-03, AC-06 |
| 4 | Role protection and home pages | Core | AC-04, AC-05, AC-07 |
| 5 | Top bar | Core | AC-08, AC-09 |
| 6 | Final check and README | Core | All |
| 7 | Leave request table and demo data | Core | – |
| 8 | Apply for leave | Core | AC-11, AC-12 |
| 9 | Employee: home tables, send to HR, withdraw | Core | AC-10, AC-14, AC-16 |
| 10 | Supervisor: sign or reject | Core | AC-13 |
| 11 | HR: shared queue, approve or reject | Core | AC-15 |
| 12 | Admin: view every record | Core | AC-17 |
| 13 | Confirmations and success messages | Core | AC-18 |
| 14 | Block overlapping requests | Stretch | AC-19 |
| 15 | Final check (module) | Core | All |

---

## Task 1 – Set up the app *(Core)*

- **Goal:** A Next.js + TypeScript app with Tailwind CSS that starts.
- **Files:** `package.json`, `next.config.ts`, `tsconfig.json`,
  `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
  (starts with `@import "tailwindcss";` – no Tailwind config file needed).
- **Check:** `npm run dev` starts, and http://localhost:3000 shows a page.

## Task 2 – Database table and demo users *(Core)*

- **Goal:** Prisma with SQLite, the `User` table from design Part A, and the
  demo users from design §9 with hashed passwords.
- **Files:** `prisma/schema.prisma`, `prisma/migrations/`, `prisma/seed.ts`,
  `src/lib/db.ts`, `src/lib/constants.ts`, `.env.example`, the `db:seed`
  script in `package.json`.
- **Check:** `npm run db:migrate` creates `prisma/dev.db`. `npm run db:seed`
  prints the 7 demo users, and `npm run db:studio` shows them.

## Task 3 – Log in and log out *(Core)*

- **Goal:** Login page, signed session cookie, and logout with a confirmation
  box. After login, go to the role's home page.
- **Files:** `src/lib/auth.ts` (`getCurrentUser`, `startSession`, `endSession`,
  `roleHome`), `src/app/actions.ts` (`loginAction`, `logoutAction`),
  `src/app/login/page.tsx`, `src/components/LoginForm.tsx`,
  `src/components/LogoutButton.tsx`, `src/components/ui/` (Button, Field,
  dialogs).
- **Check:** AC-01, AC-02, AC-03, AC-06.

## Task 4 – Role protection and home pages *(Core)*

- **Goal:** A `requireRole(...)` helper used at the top of every page, so each
  role sees only its own screens, and a home page for each role with only a short hint line.
- **Files:** `src/lib/auth.ts`, `src/app/employee/page.tsx`,
  `src/app/supervisor/page.tsx`, `src/app/hr/page.tsx`,
  `src/app/admin/page.tsx`.
- **Check:** AC-04, AC-05, AC-07.

## Task 5 – Top bar *(Core)*

- **Goal:** The top bar from design §7 (app name, who is logged in, **Log
  out**), and the **Not found** page.
- **Files:** `src/components/AppShell.tsx`, `src/components/LogoutButton.tsx`,
  `src/components/ui/`, `src/app/not-found.tsx`.
- **Check:** AC-08, AC-09.

## Task 6 – Final check and README *(Core)*

- **Goal:** Run `npm run db:seed`, then walk through the whole acceptance
  checklist as each role. Make sure `README.md` explains how to install, run
  and test.
- **Check:** Every AC box ticked; `npm run lint` and `npm run build` pass.

---

## Leave Request module – Tasks 7–15 (Session 2)

Same loop as Tasks 1–6: build → run the checks → you try it in the browser.
Core first; Task 14 (Stretch) only if you ask for it.

## Task 7 – Leave request table and demo data *(Core)*

- **Goal:** The `LeaveRequest` table from design Part A §3, the leave types
  and statuses in `src/lib/constants.ts`, and the six demo requests from
  design §14 added by the seed (users from §9 unchanged).
- **Files:** `prisma/schema.prisma`, `prisma/migrations/`,
  `src/lib/constants.ts`, `prisma/seed.ts`.
- **Check:** `npm run db:migrate` succeeds; `npm run db:seed` prints the 7
  users and 6 requests; `npm run db:studio` shows one request per status with
  January 2026 dates. Login still works (AC-01).

## Task 8 – Apply for leave *(Core)*

- **Goal:** The apply screen from design §12: an Employee opens
  `/employee/leave/new`, picks type, a supervisor **from their own
  division**, start and end, an optional reason; the day count shows as they
  pick; **Submit** saves the request as **Awaiting supervisor**. Server action
  re-checks role, division and dates (Part A §5, rules 1–3).
- **Files:** `src/app/employee/leave/new/page.tsx`,
  `src/components/LeaveRequestForm.tsx`, `src/lib/leave.ts` (day count, date
  and division validation), `src/app/actions.ts` (`applyForLeaveAction`).
- **Check:** AC-11, AC-12.

## Task 9 – Employee: home tables, send to HR, withdraw *(Core)*

- **Goal:** `/employee` shows **Action needed** and **History** (design §12);
  on the detail screen `/employee/leave/[id]` the employee can **Send to HR**
  (when **Signed**) or **Withdraw** (when **Awaiting supervisor**). Someone
  else's `[id]` sends you back to `/employee`. Server re-checks ownership and
  status.
- **Files:** `src/app/employee/page.tsx`, `src/app/employee/leave/[id]/page.tsx`,
  `src/components/LeaveRequestTable.tsx`, `src/components/LeaveDecisionButtons.tsx`,
  `src/app/actions.ts` (`sendToHrAction`, `withdrawAction`), `src/lib/leave.ts`
  (allowed transitions).
- **Check:** AC-10, AC-14, AC-16.

## Task 10 – Supervisor: sign or reject *(Core)*

- **Goal:** `/supervisor` shows only requests that named them; the decision
  screen `/supervisor/leave/[id]` has **Sign** and **Reject**; Reject
  requires a remark (Part A §5, rule 5); a decided request can't be decided
  again; not-their-request → back to `/supervisor`.
- **Files:** `src/app/supervisor/page.tsx`,
  `src/app/supervisor/leave/[id]/page.tsx`, `src/app/actions.ts`
  (`signAction`, `supervisorRejectAction`).
- **Check:** AC-13.

## Task 11 – HR: shared queue, approve or reject *(Core)*

- **Goal:** `/hr` shows every **Awaiting HR** request to both HR officers;
  `/hr/leave/[id]` has **Approve** and **Reject** (remark required on
  reject); the deciding officer is recorded in `hrDecidedById` and shown on
  the screen; after a decision no action remains (Part A §4).
- **Files:** `src/app/hr/page.tsx`, `src/app/hr/leave/[id]/page.tsx`,
  `src/app/actions.ts` (`approveAction`, `hrRejectAction`).
- **Check:** AC-15.

## Task 12 – Admin: view every record *(Core)*

- **Goal:** `/admin` shows one table with every request, final statuses and
  deciding officer — **no buttons** (Part A §5, rule 7).
- **Files:** `src/app/admin/page.tsx` (reuses
  `src/components/LeaveRequestTable.tsx`).
- **Check:** AC-17.

## Task 13 – Confirmations and success messages *(Core)*

- **Goal:** Every leave action (submit, withdraw, send, sign, reject,
  approve) confirms first with `ConfirmDialog` and reports with
  `SuccessModal`; cancelling changes nothing (requirements U15).
- **Files:** `src/components/LeaveDecisionButtons.tsx`,
  `src/components/LeaveRequestForm.tsx`, the detail screens from Tasks 8–11.
- **Check:** AC-18.

## Task 14 – Block overlapping requests *(Stretch — only if asked)*

- **Goal:** A submission is refused when it overlaps the same employee's own
  active or approved request; the error names the clashing request
  (Part A §5, rule 8; requirements U16).
- **Files:** `src/lib/leave.ts` (overlap check), `src/app/actions.ts`
  (`applyForLeaveAction`).
- **Check:** AC-19.

## Task 15 – Final check (module) *(Core)*

- **Goal:** `npm run db:seed`, then walk **AC-10 → AC-18** as each role;
  confirm the login checks (AC-01 → AC-09) still pass. Update `README.md`
  with anything new (demo requests, screens to try).
- **Check:** Every Core AC ticked; `npm run lint` and `npm run build` pass;
  login untouched and still green.
