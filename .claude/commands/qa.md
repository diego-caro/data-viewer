---
name: qa
description: Run QA automation — audit coverage for frontend and backend, fill gaps, write E2E tests. Use when the user says "qa", "coverage", or when auto-triggered after develop.
---

# QA Skill

## Instructions

Input: `$ARGUMENTS` (SCRUM ticket ID)

### Step 1 — Load agent
Load `ai-specs/agents/qa-automation.md`.

### Step 2 — Audit backend coverage
```bash
npx jest --testPathPattern="api|services" --coverage --coverageReporters=text
```
If <70%: write additional tests to fill gaps, re-run until ≥70% or flag as blocker.

### Step 3 — Audit frontend coverage
```bash
npx jest --testPathPattern="components|hooks" --coverage --coverageReporters=text
```
If <70%: write additional tests to fill gaps, re-run until ≥70% or flag as blocker.

### Step 4 — Write E2E tests
Read acceptance criteria from the SCRUM ticket.
For each criterion:
1. Create `/e2e/SCRUM-[N]-[feature].spec.ts`
2. Cover the happy path
3. Cover at least one error or edge case

Run: `npx playwright test` — all must pass.

### Step 5 — Produce QA Report
Use the QA Report format from `ai-specs/agents/qa-automation.md`.

### Step 6 — Handoff
- PASS → trigger `review` skill automatically
- FAIL → report blockers, do not proceed to review

## Rules
- Never mark QA complete with failing tests or coverage below 70%
- Logic fixes go back to the dev agent — QA only adds tests
