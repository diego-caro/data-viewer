---
name: review
description: Adversarial code review for a completed ticket. Use when the user says "revisar", "review", or when auto-triggered after QA passes. Acts as an independent reviewer — assumes gaps exist until disproved.
---

# Review Skill

## Instructions

Input: `$ARGUMENTS` (SCRUM ticket ID)

### Step 1 — Load context

Load `ai-specs/agents/reviewer.md` for the review checklist.

Fetch SCRUM-[N] from Jira MCP:
- Acceptance criteria
- Scope and out of scope
- Definition of Done

Read all changed files for this ticket.

### Step 2 — Adversarial mindset

Act as an **independent adversarial reviewer**: assume gaps, flaws, or unsafe behavior exist until disproved with evidence.

- **Try to break the system** — do not just confirm happy paths
- **Hunt incorrect assumptions** about data shape, error handling, edge cases, and empty states
- **Check cross-boundary risks** — pieces that look fine in isolation but fail together (API + UI, async + side effects)
- **Treat tests as incomplete context** — missing negative paths or spec drift hide issues

### Step 3 — Adversarial pass

For each acceptance criterion:

1. State how the implementation **could still fail** while the author believed it passed (wrong input, partial failure, empty state, oversized payload, network error)
2. Check **negative and edge cases**: validation bypass, missing error boundaries, stale data, empty collections
3. Verify **tests actually prove the criterion** — not just the happy path
4. Record **spec vs code mismatches** (ticket says X, code does Y) as first-class findings

### Step 4 — Run the full review checklist

Go through every item in `ai-specs/agents/reviewer.md`. Do not skip sections.

Classify each finding:
- **[BLOCKER]** — incorrect behavior or spec violation; must fix before merge
- **[MAJOR]** — likely bug or significant gap; fix required
- **[MINOR]** — low-risk gap or clarity issue; fix or justify
- **[SUGGESTION]** — optional improvement

### Step 5 — Produce Review Report

```markdown
## Review Report — SCRUM-[N]

### Verdict: APPROVED | CHANGES REQUESTED

### Findings

| Severity | Area | Finding | Evidence (file:line) | Suggested fix |
|----------|------|---------|----------------------|---------------|

### Summary
[1-2 sentence overall assessment]
```

### Step 6 — Act on verdict

**APPROVED:**
- Move Jira ticket to "In Review — Approved"
- Trigger `update-docs` skill automatically
- After docs updated, ask: "Ticket SCRUM-[N] approved and docs updated. Should I move it to Done and commit?"

**CHANGES REQUESTED:**
- List all BLOCKER and MAJOR findings with file + line references
- Move Jira ticket back to "In Progress"
- Assign to the relevant dev agent to fix
- Do not approve until all BLOCKERs are resolved and re-reviewed

## Rules

- Never rubber-stamp — if you can't find a flaw, explicitly state what you tested and why it holds
- Reference file and line for every BLOCKER and MAJOR
- CHANGES REQUESTED stays until all BLOCKERs are resolved
- Do not approve with any unresolved BLOCKER
- After APPROVED: trigger `update-docs` automatically
