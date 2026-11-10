# Requirements – Login and Leave Request

> **What and why.** This document says what the login must do and why. It is
> the source of truth for behaviour: when something needs to change, update this
> document **first**. New to specs? Read [README.md](README.md) first.

## 1. The problem

Budiman Company is building an HR Management System. Before anyone can use
it, the system has to know **who is using it** and **what they are allowed to
do**.

This first part of the system provides:

1. A **login** with each person's company email and password.
2. A **home page for each role**, so everyone lands in the right place.
3. **Protection**, so nobody can open another role's pages.

## 2. Who uses it (roles)

| Role | Home page | What they will do (built in Session 2) |
|------|-----------|-----------------------------------------|
| **Employee** | `/employee` | Apply for leave and track their requests. |
| **Supervisor** | `/supervisor` | Decide on requests sent to them. |
| **HR** | `/hr` | Decide on requests sent to HR. |
| **Admin** | `/admin` | See every leave record. |

Each user has exactly one role.

## 3. User stories

Format: *As a [role], I can [do something] so that [benefit].*

- **U1. Log in** *(Core)*. As any user, I can log in with my company email and
  password so that I see the screens for my role.
- **U2. Land on my home page** *(Core)*. As any user, after logging in I go
  straight to my role's home page, so I don't have to look for it.
- **U3. Stay logged in** *(Core)*. As any user, I stay logged in for up to 7
  days on the same browser, so I don't have to log in every time.
- **U4. Log out** *(Core)*. As any user, I can log out when I'm done, so the
  next person on this computer can't use my account.
- **U5. Only my own screens** *(Core)*. As any user, I can only open the pages
  for my own role, so nobody can act as someone else.

## 4. Acceptance checklist

The login is done when every box is ticked. Use the demo accounts (password
`password123`): `employee-1` and `employee-2` (Employees), `supervisor-1` and
`supervisor-2` (Supervisors), `hr-1` and `hr-2` (HR), `admin` (Admin). Each
logs in with that name followed by `@budiman.com`, e.g.
`employee-1@budiman.com`; the checks below use the short name.
Run `npm run db:seed` first to start from clean data.

| ✓ | ID | Check | How to test |
|---|----|-------|-------------|
| [ ] | AC-01 | A user can log in and lands on their role's home page. | Log in as `employee-1` → you are on `/employee`, a page with only a short hint line. Repeat for `supervisor-1` (`/supervisor`), `hr-1` (`/hr`), `admin` (`/admin`). |
| [ ] | AC-02 | A wrong password or an unknown email shows an error. | Log in as `employee-1` with password `wrong` → "Invalid email or password." Try `nobody@budiman.com` → the same message. |
| [ ] | AC-03 | Empty fields are not sent. | Click **Log in** with the boxes empty → the browser asks you to fill them in. |
| [ ] | AC-04 | A logged-out user is sent to the login page. | Log out, then type `/employee` in the address bar → you are on `/login`. |
| [ ] | AC-05 | A logged-in user who opens the login page goes to their home page. | Logged in as `hr-1`, type `/login` → you are on `/hr`. |
| [ ] | AC-06 | Logging out asks first, then returns to the login page. | Click **Log out** in the top bar → a confirmation box → confirm → you are on `/login`. |
| [ ] | AC-07 | A user cannot open another role's pages. | As `employee-1`, type `/hr` or `/admin` → you are sent back to `/employee`. As `admin`, type `/employee` → you are sent back to `/admin`. |
| [ ] | AC-08 | Every page shows who is logged in. | The top bar shows the user's name and role. On a phone, it shows the user's initials instead. |
| [ ] | AC-09 | An unknown page shows "Not found". | Type `/something-else` → "Not found", with a button back to your home page. |

## 5. Not included (for now)

These are **out of scope** for the login:

- Signing up, or resetting a forgotten password.
- Adding, editing or deleting user accounts (only the demo data creates users).
- The Leave Request module – it is specified in the second part of this file.

---

# Leave Request – Requirements

> **What and why.** This part says what the Leave Request module must do and
> why, following the Workshop Project Brief. Same rule as the login: when
> something needs to change, update this document **first**.

## 1. The problem

Budiman Company still processes leave on paper: the employee fills in a form,
the supervisor signs it, HR receives a copy and enters it into a spreadsheet.
This causes three problems:

1. Forms get lost or delayed between the employee, the supervisor and HR.
2. Employees can't see where their request is: waiting for the supervisor,
   with HR, or decided.
3. HR has no single list of requests waiting for a decision.

**Goal:** one request, one system, visible from submission to decision. Every
person sees exactly the requests they need to act on, and nothing gets lost.

A request moves through six statuses:
**Awaiting supervisor → Signed → Awaiting HR → Approved / Rejected**, and
**Withdrawn** (pulled back by the employee before the supervisor decides).

## 2. Who uses it (roles)

| Role | Home page | What they do in this module |
|------|-----------|------------------------------|
| **Employee** | `/employee` | Submits a request to a supervisor in their own division, tracks its status and remarks, withdraws it before the decision, and sends a signed request to HR. |
| **Supervisor** | `/supervisor` | Sees the requests sent to them and signs or rejects each one; a rejection needs a remark. |
| **HR** | `/hr` | Sees every request waiting for HR in one shared list and approves or rejects it; a rejection needs a remark. The officer who decides is recorded. |
| **Admin** | `/admin` | Sees every leave record. View only: changes nothing. |

Rules the workflow must follow (from the brief): employees apply, supervisors
and HR only decide; the employee chooses a supervisor from their own division;
every request passes the supervisor first; after it is signed, the employee
sends it to the shared HR queue and either HR officer may decide.

## 3. User stories

Format: *As a [role], I can [do something] so that [benefit].*

- **U6. Apply for leave** *(Core)*. As an Employee, I can submit a leave
  request (type, start date, end date, optional reason) to a supervisor in my
  own division, so I no longer need a paper form.
- **U7. Track my requests** *(Core)*. As an Employee, I can see my current and
  past requests with their status and latest remark, so I always know where my
  request is.
- **U8. Withdraw before the decision** *(Core)*. As an Employee, I can withdraw
  my request while it is still awaiting my supervisor, so I can fix a mistake
  by withdrawing and submitting a new one.
- **U9. Send a signed request to HR** *(Core)*. As an Employee, I can send a
  signed request to the shared HR queue, so HR can make the final decision.
- **U10. See requests sent to me** *(Core)*. As a Supervisor, I can see the
  requests employees sent to me, so I know what to sign.
- **U11. Sign or reject** *(Core)*. As a Supervisor, I can sign a request, or
  reject it with a remark, so the employee knows the outcome and why.
- **U12. See the HR queue** *(Core)*. As HR, I can see every request waiting
  for HR in one shared list, so nothing gets lost.
- **U13. Approve or reject as HR** *(Core)*. As HR, I can approve a request, or
  reject it with a remark, and the system records which HR officer decided.
- **U14. See every leave record** *(Core)*. As Admin, I can see every leave
  request in the system (view only), so I have the full picture without
  changing anything.
- **U15. Confirmation and success feedback** *(Core)*. As any user, every
  action (submit, withdraw, sign, reject, send, approve) asks me to confirm
  first and shows a success message after, so I never act by accident.
- **U16. No accidental double bookings** *(Stretch — agent's recommendation,
  not decided by the participant)*. As an Employee, I am blocked from
  submitting a date range that overlaps one of my own active or approved
  requests, so I don't ask for the same days twice.

Home pages: each role's page shows two tables — **Action needed** (requests
this person must act on) and **History** (everything else) — with the columns:
employee, type, dates, days, status, latest remark. Leave types are **Annual,
Sick, Emergency**. Days are counted as **calendar days, inclusive**.

## 4. Acceptance checklist

Run `npm run db:seed` first. Same demo accounts as the login checks above;
`employee-1` and `supervisor-1` share the division *Finance & Administration*,
and `employee-2` and `supervisor-2` share *Software Development*.

| ✓ | ID | Check | How to test |
|---|----|-------|-------------|
| [ ] | AC-10 | An employee submits a request and it reaches the right supervisor. | Log in as `employee-1` → **Apply for leave** → pick Annual, start 2026-12-01, end 2026-12-05, optional reason → confirm → success message. The request shows in your History as **Awaiting supervisor**, 5 days. Log in as `supervisor-1` → the request is in **Action needed**. Log in as `supervisor-2` → it is **not** there. |
| [ ] | AC-11 | Invalid requests are not sent. | On the apply form: leave fields empty → the browser asks you to fill them. End date before start date → error. Start date in the past → error. The supervisor dropdown shows only supervisors of your own division (`employee-1` sees only `Supervisor 1 (Finance & Administration)`). |
| [ ] | AC-12 | Days are counted inclusively. | Submit start 2026-12-03, end 2026-12-05 → the request shows **3 days** in every table. |
| [ ] | AC-13 | The supervisor signs or rejects, and a rejection needs a remark. | As `supervisor-1`, open `employee-1`'s request → **Sign** → confirm → success → it leaves your Action needed. As `employee-1`, the status is now **Signed** and **Send to HR** is offered. On another request click **Reject** with the remark box empty → the remark is required; fill it → the request becomes **Rejected** and the employee sees the remark in History. |
| [ ] | AC-14 | A signed request goes to the shared HR queue. | As `employee-1`, click **Send to HR** → confirm → success → status **Awaiting HR**. As `hr-1` the request is in Action needed; as `hr-2` the same request is also in Action needed (shared queue). |
| [ ] | AC-15 | Either HR officer decides, and the decider is recorded. | As `hr-1`, approve the request → confirm → success → status **Approved**, and the record shows `HR 1` as the deciding officer. Try to approve the same request as `hr-2` → no action offered; it is finished. |
| [ ] | AC-16 | The employee can withdraw only before the supervisor decides. | As `employee-1`, submit a new request → **Withdraw** → confirm → status **Withdrawn**; it disappears from the supervisor's Action needed. On a **Signed** request → no withdraw button. |
| [ ] | AC-17 | The admin sees every request and changes nothing. | As `admin`, open `/admin` → every request from all roles is listed with its final status. No sign / approve / reject / withdraw buttons anywhere on the page. |
| [ ] | AC-18 | Every action confirms first and reports success. | On submit, withdraw, sign, reject, send-to-HR and approve: each opens a confirmation box; cancelling does nothing; confirming shows a success message. |
| [ ] | AC-19 *(Stretch)* | Overlapping requests are blocked. | As `employee-1` with an active/approved request for 2026-12-01–05, submit 2026-12-03–04 → blocked with an error naming the clashing request. A range just outside (e.g. ending 2026-11-30) is allowed. |

## 5. Not included (for now)

These are **out of scope** for the Leave Request module:

- Leave balances or yearly entitlements (any employee may apply for any type).
- Email or in-app notifications (roles check their own pages).
- Editing a submitted request (withdraw and submit a new one instead).
- Filters or reports on the tables (status, type, year).
- Admin changing anything (the admin is view-only).
- Any request from a supervisor or HR on their own behalf — employees apply,
  supervisors and HR only decide.

## 6. Assumptions

These were **not explicitly decided in the interview** and can be corrected
before the design step:

1. **No leave from the past.** The start date must be today or later.
2. **No entitlement limits.** Any employee may apply for any of the three
   types, as often as they like.
3. **No notifications.** Nobody gets an email or badge; roles check their own
   pages (kept in §5 as out of scope).
4. **Rejection is final.** A rejected request cannot be reopened; to try
   again, the employee submits a new request.
5. **Withdrawn requests stay visible** in History with status **Withdrawn**;
   they are not deleted.
6. **First HR officer to act decides.** The shared queue is first-come,
   first-served; after a decision, the other HR officer sees no action.
7. **Overlap blocking (U16 / AC-19) is the agent's recommendation**, offered
   twice in the interview and left unanswered. It is marked **Stretch** so the
   core workflow is never blocked by it; say the word to drop or promote it.
8. **Employees apply only for themselves** — no applying on behalf of someone
   else.
