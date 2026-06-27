# data-viewer — Getting Started Guide

App that reads data from an external API and visualizes it in a different way.

- **Jira**: https://petreles.atlassian.net/jira/software/projects/SCRUM/boards/1
- **GitHub**: https://github.com/diego-caro
- **Stack**: Next.js 14, Angular 18, TypeScript, Tailwind CSS

---

## Before You Start — What You'll Have When Done

An ecosystem where you give an idea in natural language and Claude:
1. Converts it into a Jira ticket with acceptance criteria
2. You review and approve (or request another iteration)
3. Claude implements the code with tests (70% coverage)
4. Generates commit + PR on GitHub
5. Closes the ticket in Jira

---

## Step 1 — Install Prerequisites

Open your terminal and verify everything is installed:

```bash
node --version    # you need 20.19.0 or higher
npm --version     # you need 10 or higher
git --version     # any recent version
gh --version      # GitHub CLI — if you don't have it, see below
```

**Install GitHub CLI** (if you don't have it):
```bash
# macOS
brew install gh

# Then authenticate with your GitHub account
gh auth login
# → Choose "GitHub.com" → "HTTPS" → "Login with a web browser"
```

**Install Claude Code** (Anthropic's terminal agent):
```bash
npm install -g @anthropic-ai/claude-code
```

Verify it's installed:
```bash
claude --version
```

---

## Step 2 — Push the Project to GitHub

Create the repository on GitHub and connect it:

```bash
# Navigate to the project folder
cd /Users/diegocaro/Projects/data-viewer

# Initialize git (if you haven't already)
git init -b main

# First commit with the full scaffold
git add .
git commit -m "chore: initialize data-viewer project scaffold"

# Create the repo on GitHub and push
gh repo create data-viewer --public --source=. --remote=origin --push
```

> The repo will be at https://github.com/diego-caro/data-viewer

---

## Step 3 — Configure the Jira MCP

The Jira MCP allows Claude to read and write tickets in your Jira without you having to copy and paste anything.

### 3a — Get Your Jira API Token

1. Go to: https://id.atlassian.com/manage-profile/security/api-tokens
2. Click **"Create API token"**
3. Give it a name: `claude-data-viewer`
4. Copy the token (it's only shown once)

### 3b — Configure the MCP in Claude Code

Run this command, replacing the values:

```bash
claude mcp add \
  --name jira \
  --transport http \
  "https://mcp.atlassian.com/v1/mcp" \
  --header "Authorization: Basic $(echo -n 'diego.caro999@gmail.com:YOUR_API_TOKEN_HERE' | base64)"
```

> Replace `YOUR_API_TOKEN_HERE` with the token you copied in the previous step.

Verify it's configured:
```bash
claude mcp list
# You should see "jira" in the list
```

---

## Step 4 — Start Claude Code in the Project

```bash
cd /Users/diegocaro/Projects/data-viewer
claude
```

Claude Code automatically reads `CLAUDE.md` and loads the project rules.
You'll see something like:
```
✓ Loaded CLAUDE.md
✓ Found 7 custom commands
>
```

---

## Step 5 — The Workflow

### 5a — Give an Idea and Generate the Ticket

Write your idea in natural language. It doesn't need to be perfect:

```
/enrich I want to display the data from the API in a table with filters
```

Or if you already have a ticket in Jira:
```
/enrich SCRUM-1
```

**What happens:**
- The BA agent will ask you 2-3 questions to better understand
- Answer what you can — it also works with little info
- Claude proposes a draft ticket
- You iterate until you're satisfied (max 3 rounds)

**Example interaction:**
```
You: /enrich I want to display API data in a table

Claude (BA): Got it. I have some questions:
  1. What type of data does the table show? (e.g., users, products, etc.)
  2. Are the filters per column or is there a global search?
  3. Do you need pagination or infinite scroll?

You: they're sales records, filters by date and seller, pagination of 20 per page

Claude: [proposes the ticket with acceptance criteria]

You: looks good, approved
```

**Result:** ticket updated in Jira, status → "Ready for Dev"

---

### 5b — Review the Ticket (Your Decision)

Before proceeding, review the ticket in Jira:
https://petreles.atlassian.net/jira/software/projects/SCRUM/boards/1

If you need another iteration:
```
I need it to also include export to CSV
```

Claude updates the ticket and shows you the new version.

If it looks good:
```
looks good, start development
```

---

### 5c — Start Development

```
/develop SCRUM-1
```

**What happens automatically:**
1. Backend Dev implements the API route + unit tests
2. Frontend Dev implements the component + component tests
3. QA audits coverage (fills gaps if needed)
4. QA writes E2E tests with Cypress
5. Reviewer does code review
6. If there are critical issues → goes back to the relevant dev
7. Docs are updated automatically

**You only intervene if the Reviewer asks for your final approval.**

---

### 5d — Make the Commit and PR

After the review is approved, Claude asks:
```
Ticket SCRUM-1 approved and docs updated. Should I commit and create the PR?
```

You respond:
```
yes
```

Or you can launch it manually:
```
/commit SCRUM-1
```

**Result:**
- Commit with conventional message
- Branch pushed to GitHub
- PR created with link to the Jira ticket
- Ticket moved to "Done" in Jira

---

## Quick Command Reference

| Command | When to Use |
|---------|------------|
| `/enrich [idea or SCRUM-N]` | You have a vague idea and want to turn it into a ticket |
| `/develop SCRUM-N` | The ticket is approved and you want to start development |
| `/qa SCRUM-N` | You want to run QA manually |
| `/review SCRUM-N` | You want to request a review manually |
| `/verify SCRUM-N` | Verify that the code meets the ticket criteria |
| `/update-docs SCRUM-N` | Update documentation manually |
| `/commit SCRUM-N` | Make a commit + PR for that ticket |

---

## Project Structure (for Reference)

```
data-viewer/
├── CLAUDE.md                    ← project rules (Claude reads them automatically)
├── .claude/
│   └── commands/                ← slash commands available in Claude Code
├── docs/
│   ├── base-standards.md        ← code standards
│   ├── documentation-standards.md
│   ├── development-guide.md     ← technical guide (updated automatically)
│   ├── data-model.md            ← data model (update when you have the endpoint)
│   └── api-spec.yml             ← endpoint spec (update when you have it)
└── ai-specs/
    ├── agents/                  ← role definitions
    │   ├── pm.md
    │   ├── ba.md
    │   ├── backend-developer.md
    │   ├── frontend-developer.md
    │   ├── qa-automation.md
    │   └── reviewer.md
    └── skills/                  ← workflows
        ├── enrich/
        ├── develop/
        ├── qa/
        ├── review/
        ├── verify/
        ├── update-docs/
        └── commit/
```

---

## Next Steps When You Have the Endpoint

When you know the URL of the API you'll consume, update these two files:

1. **`docs/api-spec.yml`** — document the endpoint, parameters, and response
2. **`docs/data-model.md`** — document the shape of the data it returns

You can ask Claude to do it for you:
```
I have the endpoint: https://api.example.com/sales — it returns an array of { id, date, seller, amount }. Update the spec and data model.
```

---

## Common Troubleshooting

**Claude doesn't recognize the `/enrich` command**
→ Make sure you're in the project folder when you run `claude`
→ Verify that `.claude/commands/enrich.md` exists

**Jira MCP doesn't work**
→ Verify the token: `claude mcp list`
→ Regenerate the token at https://id.atlassian.com/manage-profile/security/api-tokens

**Coverage below 70%**
→ Normal at the beginning. Claude QA detects it and automatically adds the missing tests.
→ If QA can't reach 70% with tests, it will let you know there's a logic gap.

**Git push rejected**
→ Don't force push. Run `git pull --rebase origin main` and then push again.
