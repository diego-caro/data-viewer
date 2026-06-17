---
name: verify
description: Final check that implementation matches the ticket's acceptance criteria. Use when the user says "verificar" or "verify".
---

# Verify Skill

## Instructions

Input: `$ARGUMENTS` (SCRUM ticket ID)

### Step 1 — Load ticket
Fetch SCRUM-[N] from Jira MCP. Extract acceptance criteria and Definition of Done checklist.

### Step 2 — Verify each acceptance criterion
For each criterion:
- Check the implementation covers it
- Check a test validates it (unit or E2E)
- Mark ✅ PASS or ❌ FAIL with explanation

### Step 3 — Verify Definition of Done
- [ ] Feature implemented
- [ ] Unit tests ≥70% (backend)
- [ ] Component tests ≥70% (frontend)
- [ ] E2E test for main flow passes
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] No lint errors: `npx eslint .`

### Step 4 — Output Verification Report
```
## Verification Report — SCRUM-[N]

### Acceptance Criteria
- [criterion]: ✅ PASS / ❌ FAIL — [reason]

### Definition of Done
- [x] Feature implemented
- [x] Unit tests ≥70%
- [ ] E2E test — MISSING

### Verdict: VERIFIED / NOT VERIFIED
```

### Step 5 — Route result
- VERIFIED → trigger `review` skill
- NOT VERIFIED → report gaps, assign back to relevant dev/QA agent
