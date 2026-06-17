---
name: commit
description: Create a focused commit and push it. Optionally open a Pull Request. Use when the user says "commit", "hacer commit", or "PR". Triggered after the ticket moves to Done.
---

# Commit Skill

## Instructions

Input: `$ARGUMENTS` — ticket ID, feature name, or empty (commit everything)

### Step 0 — Dry-run mode
If the user says "solo el mensaje", "no PR", "dry run", or similar:
- Only output the list of files to stage and the proposed commit message
- Do NOT run any git commands
- Stop here

### Step 1 — Inspect state
```bash
git status
git diff
git diff --staged
```
Identify the current branch. If on `main`/`master`, create a feature branch:
```bash
git checkout -b SCRUM-[N]-[short-description]
```

### Step 2 — Resolve scope
- **No arguments**: stage all relevant changes (exclude `.env`, build artifacts, local config)
- **With ticket ID (e.g. SCRUM-42)**: stage only files that belong to that ticket; leave others unstaged

### Step 3 — Write the commit message
Format:
```
SCRUM-[N]: [imperative summary under 72 chars]

- [what changed and why]
- [areas touched]
- [any important behavior notes]
```

Rules:
- English only
- Subject line: imperative mood ("Add", "Fix", "Implement" — not "Added" or "Adding")
- No secrets, no `.env`, no generated files

### Step 4 — Commit and push
```bash
git add [files in scope]
git commit -m "[message from step 3]"
git push origin [branch] -u
```

### Step 5 — Pull Request (unless user said "no PR")
Use GitHub CLI:
```bash
gh pr create \
  --title "[SCRUM-N] [summary]" \
  --body "## Summary\n[what changed]\n\n## Ticket\nhttps://petreles.atlassian.net/browse/SCRUM-[N]\n\n## Testing\n- Unit/component coverage: ≥70%\n- E2E: ✅"
```

### Step 6 — Report
Output:
- Files committed
- Branch pushed
- PR URL

## Rules
- Never force-push without explicit user request
- If push is rejected, report and suggest rebase — do not force
- Always link the Jira ticket in the PR body
