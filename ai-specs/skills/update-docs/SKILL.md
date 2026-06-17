---
name: update-docs
description: Update all affected project documentation after a ticket is approved. Auto-triggered after review passes, before the ticket moves to Done.
---

# Update Docs Skill

## Instructions

Input: `$ARGUMENTS` (SCRUM ticket ID)

### Step 1 — Identify what changed
Review all files modified in this ticket. Categorize:

| Change | Doc to update |
|--------|--------------|
| New or changed API route | `docs/api-spec.yml` |
| New TypeScript interface or data shape | `docs/data-model.md` |
| New dependency, env var, or setup step | `docs/development-guide.md` → Setup |
| New feature shipped | `docs/development-guide.md` → Features table |
| New architecture decision | `docs/development-guide.md` → Known Decisions |
| Changed workflow or convention | relevant SKILL.md or agent .md in `ai-specs/` |

### Step 2 — Update each affected file

**`docs/api-spec.yml`**: add/update the path, params, and response schema.

**`docs/data-model.md`**: add/update the TypeScript interface and document its source.

**`docs/development-guide.md`**:
- Features table: add row `| SCRUM-[N] | [feature description] | Done |`
- API Routes table: add new routes
- Setup section: update if dependencies or env vars changed
- Known Decisions: add if an architecture decision was made

### Step 3 — Update timestamp
In `docs/development-guide.md`, update:
```
> Last updated: SCRUM-[N] — [one-line summary]
```

### Step 4 — Report
```
## Docs Updated — SCRUM-[N]

- docs/api-spec.yml: [what changed / no update needed]
- docs/data-model.md: [what changed / no update needed]
- docs/development-guide.md: [what changed / no update needed]
```

### Step 5 — Signal PM
PM agent moves ticket to Done in Jira after user confirms.

## Rules
- Update incrementally — never rewrite from scratch
- English only
- If nothing changed for a doc, state "no update needed" explicitly
