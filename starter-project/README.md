# HRMS · Starter App (Login + Leave Request)

The workshop app for the **Vibe Coding 101 with Agentic AI** workshop. It is
Budiman Company's HR Management System: **login works for all four roles**,
and the **Leave Request module** is built on top of it — the Spec-Driven
Development way: the specifications in `docs/specs/` were written and approved
first, then the AI agent built from them task by task.

## What's already here

- **Login and logout** with a company email and password, and a signed
  session cookie.
- **Four roles** – Employee, Supervisor, HR and Admin – each with its own home
  page. Nobody can open another role's pages.
- **The Leave Request module**: employees apply for Annual, Sick or Emergency
  leave (their own division's supervisor, future dates only, no overlapping
  requests); the supervisor signs or rejects (a rejection needs a remark); the
  employee sends signed requests to the shared HR queue; any HR officer
  approves or rejects, and the deciding officer is recorded. Employees can
  withdraw while the supervisor has not decided. Every action confirms first
  and shows a success message. Admin sees every request, read only.
- **The app frame**: a top bar with the app name, who is logged in and **Log out**, in the Budiman HRMS style.
- **Building blocks** in `src/components/ui/` (Button, Card, PageHeader,
  dialogs, form fields…) reused throughout the module.
- **The specs** in `docs/specs/` – requirements, design and tasks for both the
  login example and the Leave Request module.

## The Leave Request flow

1. **Employee** (`/employee`): *Apply for leave* → pick type, supervisor,
   dates (a live day count shows; overlapping dates are refused) → confirm →
   success. New requests sit in **Action needed** until someone decides;
   everything else lands in **History**. Open a request to **Withdraw** it
   (before the supervisor decides) or **Send to HR** (once signed).
2. **Supervisor** (`/supervisor`): only requests named to *you* appear. Open
   one to **Sign** (remark optional) or **Reject** (remark required).
3. **HR** (`/hr`): one shared queue of everything *Awaiting HR* — either
   officer may **Approve** or **Reject** (remark required). The screen records
   which officer decided.
4. **Admin** (`/admin`): every request in the system with its status, latest
   remark and deciding HR officer — no buttons, view only.

### Demo leave requests

`npm run db:seed` creates six requests — one per status — so every screen can
be seen right away. All are dated **January 2026**, so they never clash with
dates you type into the apply form.

| Employee   | Type      | Dates (Jan 2026) | Status             | Notes                    |
| ---------- | --------- | ---------------- | ------------------ | ------------------------ |
| Employee 1 | Annual    | 12 – 14          | Awaiting supervisor| –                        |
| Employee 2 | Sick      | 5 – 6            | Signed             | ready to send to HR      |
| Employee 1 | Emergency | 8                | Awaiting HR        | in the shared queue      |
| Employee 2 | Annual    | 19 – 23          | Approved           | decided by HR 1          |
| Employee 1 | Sick      | 26 – 27          | Rejected           | "Team busy that week"    |
| Employee 2 | Emergency | 2                | Withdrawn          | –                        |

**Try it end to end**: log in as `employee-1@budiman.com` and apply for
1–5 December 2026 → sign in as `supervisor-1@budiman.com` and sign it →
back as employee-1, send it to HR → as `hr-1@budiman.com` approve it →
as `admin@budiman.com` watch the final record.

## The project

The scenario, workflow and scope are in the **Workshop Project Brief**, which
you get from the facilitator. In Session 2 the AI agent interviews you about
it before writing anything.

## Tech stack

- **Next.js** (App Router) + TypeScript
- **Prisma 6** + **SQLite** (a local file database, no server needed)
- **Tailwind CSS**
- **bcryptjs** for password hashing
- Signed, `httpOnly` session cookie for login

## Getting started

You need **Node.js 20.9 or newer** (check with `node --version`) and Git.

```bash
npm install            # 1. install dependencies (needs internet)
cp .env.example .env   # 2. create your settings file (Windows: copy .env.example .env)
npm run db:migrate     # 3. create the SQLite database from prisma/migrations
npm run db:seed        # 4. add the demo users and leave requests
npm run dev            # 5. start the app at http://localhost:3000
```

To reset the demo data at any time, run `npm run db:seed` again (it recreates
the users and the six demo requests).

**If something goes wrong**

| Problem | Fix |
|---------|-----|
| `Environment variable not found: DATABASE_URL` | You skipped step 2. Create the `.env` file. |
| `npm install` fails while downloading Prisma engines | Your network blocks `binaries.prisma.sh`. Try another network, or ask the facilitator. |
| `Port 3000 is in use` | Another app is running. Stop it, or run `npm run dev -- -p 3001`. |
| Login says "Invalid email or password" | Run `npm run db:seed` to recreate the demo users. |

## Demo accounts

All demo users share the password `password123`.

| Email                      | Role | Home page |
| -------------------------- | ---- | --------- |
| `employee-1@budiman.com`   | Employee | `/employee` |
| `employee-2@budiman.com`   | Employee | `/employee` |
| `supervisor-1@budiman.com` | Supervisor | `/supervisor` |
| `supervisor-2@budiman.com` | Supervisor | `/supervisor` |
| `hr-1@budiman.com`         | HR | `/hr` |
| `hr-2@budiman.com`         | HR | `/hr` |
| `admin@budiman.com`        | Admin | `/admin` |

## Scripts

| Command            | What it does |
|--------------------|--------------|
| `npm run dev`      | Start the dev server. |
| `npm run build`    | Production build. |
| `npm run start`    | Serve the production build. |
| `npm run lint`     | Run ESLint. |
| `npm run db:migrate` | Apply Prisma migrations. |
| `npm run db:seed`  | Reseed the demo users. |
| `npm run db:studio` | Open Prisma Studio to inspect the data. |

## Specifications

The specs live in `docs/specs/`. Start with `docs/specs/README.md` – it
explains how to read them and has a glossary of terms.

- `01-requirements.md` — user stories and the acceptance checklist for login
  (U1–U5) and the Leave Request module (U6–U16, AC-10–AC-19), each marked
  Core or Stretch.
- `02-design.md` — Part A: data design (the `User` and `LeaveRequest` tables,
  statuses, rules, who sees what). Part B: app design (screens, code layout,
  demo data).
- `03-tasks.md` — the ordered build tasks and which checks prove each one is
  done (login Tasks 1–6, Leave Request Tasks 7–15).

`docs/specs/checklists.md` has a checklist to run before each approval and
build step.

The rule of the workshop: when something changes, **fix the spec first**, then
build it — never patch the code ahead of the spec.

## Working with the AI agent

`AGENTS.md` tells the AI agent how to work with you in Session 2: it
**interviews you first**, writes the specs with you one at a time (waiting for
your approval after each), then builds task by task and asks you to check
each one in the browser.

To begin, start a new chat in the Illham Harness and type the line below. You
can also attach the Workshop Project Brief to give the agent the details.

> Read AGENTS.md, then start the interview.
