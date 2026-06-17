# Development Guide

> This document is a living guide. Updated automatically after each completed ticket.
> Last updated: project initialized

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
npm install
```

### Environment Variables
```env
# .env.local
SOURCE_API_URL=         # Base URL of the external API (TBD)
SOURCE_API_KEY=         # API key if required (leave empty if public)
```

### Run Development Server
```bash
npm run dev
```

### Run Tests
```bash
# All tests with coverage
npm run test:coverage

# Backend only
npx jest --testPathPattern="api|services" --coverage

# Frontend only
npx jest --testPathPattern="components|hooks" --coverage

# E2E
npx cypress run
```

## Architecture

### Folder Structure
```
/app/
  /api/               → API route handlers (server-side)
  /[pages]/           → Next.js pages (App Router)
/components/          → Reusable UI components
/lib/
  /services/          → External API abstraction layer
  /types/             → Shared TypeScript interfaces
  /utils/             → Pure utility functions
/hooks/               → Custom React hooks
/__tests__/
  /api/               → Unit tests for API routes
  /services/          → Unit tests for services
  /components/        → Component tests
/cypress/e2e/         → Cypress E2E tests
/docs/                → Project documentation
/ai-specs/            → AI agent definitions and skills
```

### Data Flow
```
External API → /lib/services/ → /app/api/ route → Component → UI
```

All external data fetching is isolated in `/lib/services/`. API routes transform and expose data. Components only receive typed props.

## Features
> Updated automatically after each completed SCRUM ticket.

| Ticket | Feature | Status |
|--------|---------|--------|
| — | — | — |

## API Routes
> Updated automatically when new routes are added.

| Method | Path | Description |
|--------|------|-------------|
| — | — | Routes will appear here as implemented |

## Known Decisions & Trade-offs
> Architecture decisions are added here as they are made.

- Server components by default to minimize client JS bundle size
- All external API calls isolated in `/lib/services/` to decouple UI from data source
