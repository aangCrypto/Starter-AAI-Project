# Design – Login and Leave Request

> **How it is built.** This document turns the requirements into a plan a
> builder (person or AI) can follow without asking the business again.
> [01-requirements.md](01-requirements.md) is the source of truth for
> *behaviour*; if the two disagree, fix the requirements first, then this file.
>
> - **Part A – Data design** (sections 1–5): **you own and review this.**
> - **Part B – App design** (sections 6–11): the AI drafts this; you check it.

---

# Part A – Data design (you review)

## 1. Tables

The app stores data in one table so far. Every row gets a number (`id`)
automatically. The leave request table you add in Session 2 is described in §3.

### `User` – one row per person who can log in

| Field | Type | Required? | What it holds |
|-------|------|-----------|---------------|
| `id` | number | auto | Unique number for the user |
| `email` | text | yes, unique | Used to log in, stored in lowercase, e.g. `employee-1@budiman.com` |
| `name` | text | yes | Full name shown on screen, with the division in brackets, e.g. "Employee 1 (Finance & Administration)" |
| `passwordHash` | text | yes | Scrambled password – never the real one |
| `role` | text | yes | `EMPLOYEE`, `SUPERVISOR`, `HR` or `ADMIN` |
| `identificationNo` | text | yes | Staff ID: `00-1` then 5 digits, e.g. `00-148291` |
| `designation` | text | yes | Job title, one of the list in rule 4, e.g. `Administrative Officer` |
| `division` | text | yes | Department, one of the list in rule 4, e.g. `Finance & Administration` |
| `createdAt` | date + time | auto | When the user was created |

> **Why is role plain text?** SQLite (our database) does not support a fixed
> list of choices ("enums"). So the allowed values are listed in
> `src/lib/constants.ts`, and the app checks them.

## 2. Business rules

1. **Emails.** Every email is a company address ending in `@budiman.com`. It is
   stored in lowercase and is unique, so login ignores capitals.
2. **Passwords.** Stored only as a hash (bcrypt). A wrong email and a wrong
   password give the **same** message, so nobody can find out which emails exist.
3. **Roles.** Each user has exactly one role. The role decides which pages they
   can open (§7).
4. **Divisions and designations** are chosen from fixed lists, kept in
   `src/lib/constants.ts`:
   - **Division:** Software Development, Quality Assurance, IT Infrastructure &
     Operations, Cybersecurity, Data & Analytics, Product & Design, Customer
     Support, Human Resources, Finance & Administration, Management.
   - **Designation:** Software Engineer, QA Engineer, System Administrator,
     IT Support Technician, Data Analyst, UI/UX Designer, Team Lead, HR Officer,
     Administrative Officer, Director. The designation is only a job title;
     the role decides what someone can do.
5. **Sessions.** A login lasts 7 days on the same browser, then the user must
   log in again.

## 3. Leave Request – table (Session 2)

### `LeaveRequest` – one row per leave request

**What one row is:** one leave application by one employee, covering one date
range. The employee fills the form; nobody edits these fields afterwards
(§5, rule 6) — a mistake is fixed by withdrawing and submitting a new one.

| Field | Type | Required? | What it holds |
|-------|------|-----------|---------------|
| `id` | number | auto | Unique number for the request |
| `employeeId` | number | yes | Who applied — a `User` with role Employee |
| `supervisorId` | number | yes | The supervisor the employee chose to sign it; must be a `User` with role Supervisor in the **same division** as the employee |
| `leaveType` | text | yes | `ANNUAL`, `SICK` or `EMERGENCY` |
| `startDate` | date | yes | First day of leave; never in the past at submission |
| `endDate` | date | yes | Last day of leave; never before `startDate` |
| `days` | number | yes | Calendar days, inclusive, **calculated by the app at submission** (2026-12-03 to 2026-12-05 = 3). Never typed in by hand, never edited later |
| `reason` | text | no | Why the employee wants the leave; can be left empty |
| `status` | text | yes | One of the six in §4 |
| `supervisorRemark` | text | no | The supervisor's note: required on **reject**, optional on sign |
| `hrRemark` | text | no | The HR officer's note: required on **reject**, optional on approve |
| `hrDecidedById` | number | no | Which HR officer approved or rejected; empty until the HR decision; then never empty and never changes |
| `createdAt` | date + time | auto | When the request was submitted |
| `updatedAt` | date + time | auto | When the status last changed; used to order the "Action needed" tables |

> **Why are `status` and `leaveType` plain text?** Like `role`, SQLite has no
> fixed choice lists ("enums"). The allowed values live in
> `src/lib/constants.ts` and the app checks every value (rule 4).

## 4. Leave Request – statuses and allowed state changes

A request starts at **Awaiting supervisor** when the employee submits. Only
these moves are allowed — everything else is refused:

| Status | In plain words | Who may move it on, and how |
|--------|----------------|------------------------------|
| **Awaiting supervisor** | Submitted, waiting for the chosen supervisor to decide | The chosen **supervisor** → **Signed** (sign) or **Rejected** (reject, remark required). The **employee** → **Withdrawn** (withdraw, with confirmation) |
| **Signed** | Supervisor signed; waiting for the employee to send it to HR | The **employee** → **Awaiting HR** (send to HR, with confirmation) |
| **Awaiting HR** | In the shared HR queue; either HR officer may decide | Any **HR** → **Approved** (approve) or **Rejected** (reject, remark required). The officer who acts is recorded in `hrDecidedById` |
| **Approved** | Finished — leave granted | Nobody. Final state |
| **Rejected** | Finished — refused, with a remark explaining why | Nobody. Final state |
| **Withdrawn** | Pulled back by the employee before the supervisor decided | Nobody. Final state |

- A person may only act on requests the visibility table (§5) gives them.
- Each stage is decided **once**: after the supervisor signs or rejects, the
  supervisor can do nothing more; after HR decides, nobody can do anything.
- **Withdraw is only offered in Awaiting supervisor** — not after signing.
- **Rejected is final**: to try again, the employee submits a new request.

## 5. Leave Request – business rules and who sees what

**Business rules**

1. **Only Employees create requests, only for themselves.** Supervisors, HR
   and Admin cannot apply.
2. **The supervisor must be a real supervisor of the same division.** The form
   only offers those, and the server checks it again on submit.
3. **Dates.** Start is today or later; end is on or after start; `days` is
   always the app's own inclusive calendar-day count.
4. **Fixed choices.** `leaveType` and `status` accept only the values listed
   in `src/lib/constants.ts` — like roles and divisions already do.
5. **Remarks.** A rejection (supervisor or HR) must carry a remark. Signing
   and approving may carry one, but don't need one.
6. **No editing.** Once submitted, none of the form fields ever change. Only
   the actions in §4 change the status (and the remark/decider fields that go
   with them).
7. **Admin is read-only** — the admin can never create, change or delete a
   request.
8. *(Stretch — U16)* **No overlap.** A submission is refused when its range
   overlaps one of the same employee's own requests that is still active
   (Awaiting supervisor, Signed, Awaiting HR) or already Approved; the error
   names the clashing request.

**Who sees what, and who may change what**

| Who | Sees | May change (their own actions only) |
|-----|------|--------------------------------------|
| **Employee** | Only their own requests | Submit new; withdraw own **Awaiting supervisor**; send own **Signed** to HR |
| **Supervisor** | Only requests that named them as `supervisorId` | Sign or reject their **Awaiting supervisor** requests |
| **HR** | Every request (shared queue) | Approve or reject any **Awaiting HR** request; the acting officer is recorded |
| **Admin** | Every request | Nothing — view only |

Server actions re-check these rules every time: showing a button is not
enough; the server refuses actions the person is not allowed to take (§10).

---

# Part B – App design (AI drafts, you check)

## 6. Technology

Chosen so everyone can run the app on their own laptop with no extra accounts.

| Part | Choice | In plain words |
|------|--------|----------------|
| Web framework | **Next.js** (App Router) + **TypeScript** | Builds both the screens and the server logic in one project. |
| Database | **SQLite** via **Prisma 6** | The database is a single file; Prisma lets the code read and write it. |
| Login | Signed **session cookie** | After login the browser keeps a signed note saying who you are (7 days). JavaScript on the page can't read it (`httpOnly`). |
| Passwords | **bcryptjs** | Stores a scrambled version of each password. |
| Styling | **Tailwind CSS v4** | Styles are written as class names, e.g. `text-sm`. No config file needed. |
| Buttons and forms | **Server actions** | Pressing a button calls a function on the server, which checks the user before doing anything. There are no separate `/api` routes. |

## 7. Screens (routes)

After login, each user is sent to their role's home page. Opening a page for
another role sends you back to your own home page.

| Route | Who | What it shows |
|-------|-----|---------------|
| `/` | anyone | Sends you to your home page, or to `/login`. |
| `/login` | anyone | Email and password form. A logged-in user is sent to their home page. |
| `/employee` | Employee | A page with only a short hint ("This page is empty. Continue here with your own project…") until Session 2. |
| `/supervisor` | Supervisor | A page with only a short hint ("This page is empty. Continue here with your own project…") until Session 2. |
| `/hr` | HR | A page with only a short hint ("This page is empty. Continue here with your own project…") until Session 2. |
| `/admin` | Admin | A page with only a short hint ("This page is empty. Continue here with your own project…") until Session 2. |

A page that doesn't exist shows **Not found**, with a button back to your
home page.

**Layout:** no sidebar. A top bar across every page shows the app name
(Budiman HRMS) on the left. On the right it shows who is logged in (name and
role) and a **Log out** button. On a phone it shows the user's initials
instead of the name and role. The page below the top bar is empty apart from a short hint line.

**Feedback:** **Log out** opens a confirmation box first. Errors are shown in
red above the form.

## 8. Where the code lives

| Folder / file | What's in it |
|---------------|--------------|
| `prisma/schema.prisma` | The tables from Part A. |
| `prisma/migrations/` | Steps that create the tables. |
| `prisma/seed.ts` | The demo users (§9). |
| `src/lib/constants.ts` | Roles, divisions, designations, time zone, date helpers. |
| `src/lib/auth.ts` | Login cookie, `getCurrentUser()`, `requireRole()`, `roleHome()`. |
| `src/lib/db.ts` | The single database connection. |
| `src/app/actions.ts` | Server actions: `loginAction`, `logoutAction`. |
| `src/app/login/` | The login page. |
| `src/app/<role>/` | One folder per role's screens (pages with only a hint for now). |
| `src/components/` | Screen pieces: app frame (top bar), login form and log out button. |
| `src/components/ui/` | Small building blocks used everywhere: Button, Card, PageHeader, EmptyState, Avatar, Icons, form field styles, dialogs, and the overlay page scrollbar. Use these when you build the module. |
| `src/app/globals.css` | Brand colours (the `brand-…` and `navy` colours). Change them here. |

## 9. Demo data

`npm run db:seed` deletes all users and creates:

| Email (`@budiman.com`) | Name | Role | ID no. | Designation | Division |
|----------|------|------|--------|-------------|----------|
| `employee-1@` | Employee 1 (Finance & Administration) | Employee | 00-148291 | Administrative Officer | Finance & Administration |
| `employee-2@` | Employee 2 (Software Development) | Employee | 00-173604 | Software Engineer | Software Development |
| `supervisor-1@` | Supervisor 1 (Finance & Administration) | Supervisor | 00-159827 | Team Lead | Finance & Administration |
| `supervisor-2@` | Supervisor 2 (Software Development) | Supervisor | 00-126418 | Team Lead | Software Development |
| `hr-1@` | HR 1 (Human Resources) | HR | 00-191356 | HR Officer | Human Resources |
| `hr-2@` | HR 2 (Human Resources) | HR | 00-184072 | HR Officer | Human Resources |
| `admin@` | Admin (Management) | Admin | 00-105739 | Director | Management |

All use the password `password123` (workshop only). There are two users for
each of Employee, Supervisor and HR, in different divisions, so the module you
build can be tested with more than one person per role.

## 10. Security (in plain words)

- Every page checks who is logged in and their role (`requireRole`).
- Every server action checks again on the server – hiding a button is not enough.
- The login cookie is signed with `AUTH_SECRET` from `.env`, so it can't be faked.
- Passwords are stored only as a hash.

## 11. Commands

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the app at http://localhost:3000 |
| `npm run db:migrate` | Create or update the database tables |
| `npm run db:seed` | Reset the demo users |
| `npm run db:studio` | Open a browser view of the database |
| `npm run lint` | Check the code for common mistakes |
| `npm run build` | Check the whole app compiles |

## 12. Leave Request – screens (Session 2)

These screens replace the "This page is empty" hint lines on the four role
home pages (§7). Every page and every server action starts with
`requireRole(...)` for its role — Part A §5 decides who may see and change
what, and the server re-checks it every time (§10).

**One screen for each role action.** Home pages hold the tables and the
buttons that lead somewhere; the actual doing happens on its own screen.

| Route | Who | What it shows / what can be done |
|-------|-----|----------------------------------|
| `/employee` | Employee | Two tables: **Action needed** (own requests waiting on *them*: **Signed** → link to send, **Awaiting supervisor** → link to withdraw) and **History** (all their requests). A **Apply for leave** button at the top. |
| `/employee/leave/new` | Employee | The apply form: leave type, supervisor (only their own division's), start date, end date, optional reason. Shows the day count as you pick dates. **Submit** asks to confirm, then shows success and returns to `/employee`. Errors appear in red above the form (Part A §5, rules 2–3). |
| `/employee/leave/[id]` | Employee | Detail of one **own** request (all fields, both remarks, status, deciding HR officer if set) — with **Send to HR** when it is **Signed**, and **Withdraw** when it is **Awaiting supervisor**. Any other status shows no action buttons. Someone else's request → sent back to `/employee`. |
| `/supervisor` | Supervisor | Two tables: **Action needed** = requests that named them and are **Awaiting supervisor** (each row links to its decision screen) and **History** = the ones they decided. |
| `/supervisor/leave/[id]` | Supervisor | Detail of one request **named to them** while **Awaiting supervisor**, with **Sign** and **Reject**. Reject opens a remark box and refuses an empty remark (Part A §5, rule 5). Not their request or wrong status → sent back to `/supervisor`. |
| `/hr` | HR | Two tables: **Action needed** = every **Awaiting HR** request (the shared queue — both HR officers see the same list) and **History** = everything else. Rows link to the decision screen. |
| `/hr/leave/[id]` | HR | Detail of one **Awaiting HR** request, with **Approve** and **Reject**. Reject opens a remark box and refuses an empty remark. The screen shows which HR officer decided once there is a decision. Wrong status → sent back to `/hr`. |
| `/admin` | Admin | **One table: every request in the system** with its final status and deciding HR officer. **No buttons anywhere** — view only (Part A §5, rule 7). |

Opening another role's screen sends you back to your own home page — the
same protection as the login (§7).

**Building blocks (reuse, don't reinvent):** `PageHeader`, `Card`, `Button`,
`Field`, `DetailSection`, `ConfirmDialog`, `SuccessModal`, `EmptyState`
(`src/components/ui/`). Every action **confirms first** with `ConfirmDialog`
and **reports success** with `SuccessModal` (requirements U15 / AC-18).
An empty table shows `EmptyState` ("Nothing waiting for you"). Errors are
shown in red above the form, like the login does.

## 13. Leave Request – where the code lives

| Folder / file | What's in it |
|---------------|--------------|
| `prisma/schema.prisma` | The `LeaveRequest` model from Part A §3. |
| `src/lib/constants.ts` | Adds `LEAVE_TYPES` and `STATUSES` with their plain-English labels (SQLite has no enums). |
| `src/lib/leave.ts` | Plain helpers, no database: day count (inclusive), date validation, allowed status transitions (Part A §4). |
| `src/app/actions.ts` | New server actions: `applyForLeaveAction`, `withdrawAction`, `sendToHrAction`, `signAction`, `supervisorRejectAction`, `approveAction`, `hrRejectAction`. **Each one re-checks role, ownership and the current status before changing anything.** |
| `src/components/LeaveRequestTable.tsx` | One shared table (employee, type, dates, days, status, latest remark) used by all four homes and the admin page; rows link to the right detail screen for that role. |
| `src/components/LeaveRequestForm.tsx` | The apply form from §12. |
| `src/components/LeaveDecisionButtons.tsx` | The action buttons + confirm + success wiring for the detail screens. |
| `src/app/employee/leave/` | `new/` (apply) and `[id]/` (detail) pages. |
| `src/app/supervisor/leave/[id]/` | The supervisor decision page. |
| `src/app/hr/leave/[id]/` | The HR decision page. |

## 14. Leave Request – demo data

`npm run db:seed` keeps creating the 7 users (§9) **and** adds six requests —
one per status — so every screen can be seen right after seeding. All seeded
dates are in **January 2026** so they never clash with the dates used in the
acceptance checks (AC-10 and on).

| Employee | Supervisor | Type | Dates | Status | Notes |
|----------|-----------|------|-------|--------|-------|
| Employee 1 | Supervisor 1 | Annual | 2026-01-12 – 14 | Awaiting supervisor | – |
| Employee 2 | Supervisor 2 | Sick | 2026-01-05 – 06 | Signed | – |
| Employee 1 | Supervisor 1 | Emergency | 2026-01-08 | Awaiting HR | – |
| Employee 2 | Supervisor 2 | Annual | 2026-01-19 – 23 | Approved | decided by `hr-1` |
| Employee 1 | Supervisor 1 | Sick | 2026-01-26 – 27 | Rejected | supervisor remark: "Team busy that week" |
| Employee 2 | Supervisor 2 | Emergency | 2026-01-02 | Withdrawn | – |
