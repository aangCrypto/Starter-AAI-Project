# Starter AAI Project

**Branch Tested**: `test`

Starter base for the **Agentic AI Workshop**. It holds
the starter app and the workshop project brief.

## What's in this repo

| Path | What it is |
|------|------------|
| `starter-project/` | The starter app: Budiman Company's HR Management System with login for four roles (Employee, Supervisor, HR, Admin). |
| `Agentic AI - Workshop Project Brief.pdf` | The scenario, workflow and scope for the workshop project. |

## The starter app

A Next.js + TypeScript app with Prisma and SQLite. In the workshop you add the
**Leave Request module** to it using Spec-Driven Development: interview, specs,
review, then build.

See [`starter-project/README.md`](starter-project/README.md) for the full
details: tech stack, demo accounts, scripts and specs.

## Quick start

You need **Node.js 20.9 or newer** and Git.

```bash
cd starter-project
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev            # http://localhost:3000
```

## How the workshop works

1. Start a chat with the AI agent and type: `Read AGENTS.md, then start the interview.`
2. The agent interviews you, then writes the specs with you. You approve each step.
3. The agent builds one task at a time and you check each one in the browser.

When something changes, fix the spec first, then rebuild. The agent's
instructions are in [`starter-project/AGENTS.md`](starter-project/AGENTS.md).
