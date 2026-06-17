---
name: develop
description: Implement a SCRUM ticket. Runs backend then frontend in sequence with TDD. Use when the user says "desarrollar", "implementar", or "develop".
---

# Develop Skill

## Instructions

Input: `$ARGUMENTS` (SCRUM ticket ID)

### Step 1 — Load ticket
Fetch SCRUM-[N] from Jira MCP. Confirm it has status "Ready for Dev" and a complete enriched story.
If not enriched: stop and run the `enrich` skill first.

### Step 2 — Move to "In Progress"
Via Jira MCP: set ticket status to "In Progress".

### Step 3 — Backend implementation
Load `ai-specs/agents/backend-developer.md`.

TDD cycle:
1. Write failing tests in `/__tests__/api/` or `/__tests__/services/`
2. Implement minimal code to pass them
3. Run: `npx jest --testPathPattern="api|services" --coverage`
4. Confirm ≥70% before continuing

### Step 4 — Frontend implementation
Load `ai-specs/agents/frontend-developer.md`.

TDD cycle:
1. Write failing component tests
2. Implement the component(s)
3. Run: `npx jest --testPathPattern="components|hooks" --coverage`
4. Confirm ≥70% before continuing

### Step 5 — Trigger QA
Signal that development is complete and automatically trigger the `qa` skill.

## Rules
- Never skip tests to finish faster
- Coverage below 70% = task not complete
- One ticket at a time
