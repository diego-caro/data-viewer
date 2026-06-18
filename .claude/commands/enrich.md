---
name: enrich
description: Interpret a vague requirement or SCRUM ticket and progressively refine it into an implementation-ready user story. Use when the user says "refinar", "interpretar", "enrich", or provides a rough idea.
---

# Enrich Skill

## Instructions

Input: `$ARGUMENTS` (SCRUM ticket ID or raw idea/text)

### Step 1 — Load context
- If a SCRUM ticket ID is given: fetch it via Jira MCP from https://petreles.atlassian.net
- If raw text is given: use it directly
- Load `docs/data-model.md` and `docs/api-spec.yml` for technical context

### Step 2 — Adopt BA Agent
Load and follow `ai-specs/agents/ba.md`.

### Step 3 — Assess completeness
Identify what is clear and what is missing. Ask max 3 targeted questions:
1. What problem does this solve? (if not stated)
2. Who is the user? (if not stated)
3. What is the expected outcome? (if vague)

### Step 4 — Propose a draft
After answers, write a draft user story using the BA output format.
Ask: "Does this capture what you need, or should we adjust anything?"

### Step 5 — Iterate
Repeat steps 3-4 until approved. Max 3 refinement rounds.
After 3 rounds with no approval, flag the ambiguity and ask for more context.

### Step 6 — Finalize and update Jira
Once approved:
1. Write the final enriched story using the full BA output format
2. Update the SCRUM ticket via Jira MCP (append enriched content, keep original)
3. Move ticket status to "Ready for Dev"
4. PM agent assigns priority

### Step 7 — Sprint assignment
1. Use Jira MCP to get the list of boards for project SCRUM
2. Get the active sprint for the board:
   - If an active sprint exists → add the ticket to it
   - If NO active sprint exists → create one named "Sprint [N]" (increment from last sprint number, or "Sprint 1" if none exist), start it immediately, then add the ticket to it
3. Confirm: "Ticket SCRUM-[N] added to [Sprint name]."

## Rules
- Never skip to implementation during this skill
- If the idea spans multiple features, split into separate tickets and confirm
- Always assign to sprint at the end — never leave a ticket only in the backlog
