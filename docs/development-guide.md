# Development Guide

> This document is a living guide. Updated automatically after each completed ticket.
> Last updated: SCRUM-6 — Players List by Category (hardcoded data, full backend + frontend)

## Project Overview
App that reads data from an external REST API and visualizes it in a different way.

- **Jira**: https://petreles.atlassian.net/jira/software/projects/SCRUM/boards/1
- **Stack**: Next.js 14 (App Router, backend/API), Angular 18 (frontend), TypeScript, Tailwind CSS
- **Testing**: Jest + Angular TestBed, Cypress (E2E)

## Setup

### Prerequisites
- Node.js 20.19.0+
- npm 10+

### Install
```bash
git clone [repo-url]
cd data-viewer

# Backend (Next.js)
cd backend && npm install

# Frontend (Angular)
cd ../frontend && npm install
```

### Environment Variables
```env
# backend/.env.local
SOURCE_API_URL=         # Base URL of the external API (TBD)
SOURCE_API_KEY=         # API key if required (leave empty if public)
```

Frontend API base URL is configured in `frontend/src/environments/environment.ts`.

### Run Development Servers
```bash
# Backend (port 3000)
cd backend && npm run dev

# Frontend (port 4200) — separate terminal
cd frontend && npx ng serve
```

### Run Tests
```bash
# Backend — all tests with coverage
cd backend && npx jest --coverage

# Frontend — all tests with coverage
cd frontend && npx jest --coverage

# E2E (requires both servers running)
cd frontend && npx cypress run
```

## Architecture

### Folder Structure
```
backend/                        → Next.js 14 App Router (API server)
  src/app/api/                  → API route handlers
  src/lib/services/             → Data layer (hardcoded now, external API later)
  src/lib/types/                → Shared TypeScript interfaces
  __tests__/api/                → Unit tests for API routes
  __tests__/services/           → Unit tests for services

frontend/                       → Angular 18 (UI client)
  src/app/models/               → TypeScript interfaces
  src/app/services/             → Angular services (HttpClient)
  src/app/pages/                → Routed page components
  src/app/components/           → Reusable UI components
  cypress/e2e/                  → Cypress E2E tests

docs/                           → Project documentation
ai-specs/                       → AI agent definitions and skills
```

### Data Flow
```
External API → backend/lib/services/ → backend/app/api/ → Angular Service → Component → UI
```

All external data fetching is isolated in `backend/src/lib/services/`. API routes expose typed endpoints. Angular services call the API via `HttpClient`. Components handle loading, error, and empty states.

## Features
> Updated automatically after each completed SCRUM ticket.

| Ticket | Feature | Status |
|--------|---------|--------|
| SCRUM-6 | Players List by Category — display player roster grouped by category with status badges | Done |

## API Routes
> Updated automatically when new routes are added.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/categories` | List all player categories |
| GET | `/api/players?categoryId=X` | List players filtered by category (400 if missing, 404 if not found) |

## Known Decisions & Trade-offs
> Architecture decisions are added here as they are made.

- Separate backend (Next.js 14, port 3000) and frontend (Angular 18, port 4200) projects
- All external API calls isolated in `backend/src/lib/services/` to decouple UI from data source
- Player data hardcoded initially in the service layer — typed interfaces ready for API swap
- Player/Category types duplicated between backend and frontend (shared package planned for later)
