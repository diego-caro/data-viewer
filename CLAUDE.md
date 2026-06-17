---
description: Global rules for all AI agents working on this project.
alwaysApply: true
---

# Project Rules — data-viewer

## Project
App that reads data from an external REST API and visualizes it in a different way.
- **Jira project**: SCRUM (https://petreles.atlassian.net/jira/software/projects/SCRUM/boards/1)
- **Source API**: TBD — update `docs/api-spec.yml` when defined

## Stack
- **Framework**: Next.js 14+ (App Router) — backend/API; Angular — frontend
- **Language**: TypeScript (strict mode, no `any`)
- **Styling**: Tailwind CSS
- **Testing**: Jest + Angular Testing Library (frontend), Jest (backend/API)
- **E2E**: Cypress

## Core Principles
1. **One task at a time** — never jump ahead without confirmation
2. **TDD** — write failing tests first, then implement
3. **70% minimum coverage** — enforced for both frontend and backend
4. **English only** — all code, comments, commits, and docs in English
5. **Typed** — all functions, components, and API responses must be fully typed

## Agent Roles
Load the relevant agent from `ai-specs/agents/` before starting any task:
- `pm.md` — managing Jira tickets, prioritizing, tracking status
- `ba.md` — interpreting vague requirements, progressive refinement
- `backend-developer.md` — API routes, data fetching, server logic
- `frontend-developer.md` — UI components, pages, client state
- `qa-automation.md` — coverage audit, E2E tests, automation
- `reviewer.md` — code review before closing a ticket

## Skills
Load the relevant skill from `ai-specs/skills/` when a workflow is triggered:
- `enrich` → "refinar [ticket]" or "interpretar requerimiento"
- `develop` → "desarrollar [ticket]"
- `qa` → "qa [ticket]" or "coverage"
- `review` → "revisar [ticket]"
- `verify` → "verificar [ticket]"
- `update-docs` → auto-triggered after review; also "actualizar docs [ticket]"
- `commit` → "commit", "hacer commit", "PR" — último paso antes de cerrar el ticket
- `audit` → "auditar", "audit", "dead code", "deuda técnica" — auditoría completa de calidad de código
- `worktree` → "worktree", "trabajo en paralelo", "aislar feature" — aislamiento con git worktrees para trabajo paralelo

## Workflow Order (per ticket)
1. BA enriches and refines the requirement
2. You approve
3. Backend Dev implements API/logic + unit tests
4. Frontend Dev implements UI + component tests
5. QA Automation runs coverage and writes E2E tests
6. Reviewer reviews the full change
7. update-docs updates all affected documentation automatically
8. You approve → commit skill creates commit + PR + moves ticket to Done in Jira
