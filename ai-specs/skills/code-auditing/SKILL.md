---
name: code-auditing
description: Comprehensive code quality audit for the project. Use when the user says "auditar", "audit", "código limpio", "deuda técnica", "dead code", or wants a full quality review before a release or after significant growth of the codebase.
version: 1.0.0
---

# Code Auditing Skill

Systematic code quality audit methodology for this project: Next.js 14 backend + Angular 18 frontend, TypeScript strict mode.

## When to Use

- Comprehensive code quality audits
- Dead code and unused dependency identification
- Security vulnerability assessments
- Technical debt identification and prioritization
- Pre-release code reviews
- Angular/Next.js best practices verification

## Audit Phases

### Phase 0: Pre-Analysis Setup

1. Check project configuration files: `package.json`, `tsconfig.json`, `angular.json`, `.eslintrc`
2. Identify all active libraries and their versions
3. Run existing linting and type checks as baseline:
   ```bash
   npm run lint
   npx tsc --noEmit
   npx jest --coverage
   ```
4. Document existing errors/warnings — these are the baseline, not new findings

### Phase 1: Discovery

1. Map all source files by layer:
   - Backend: `/app/api/`, `/lib/services/`, `/lib/types/`, `/lib/utils/`
   - Frontend: `/src/app/components/`, `/src/app/services/`, `/src/app/store/`
2. Group by feature/module for contextual analysis
3. Create a tracking list — mark each file as pending / in-progress / done

### Phase 2: File-by-File Analysis

For each file, analyze:

**Dead Code**
- Unused functions, methods, variables, imports
- Unreachable code blocks
- Commented-out code left in production files
- Exported symbols never imported elsewhere

**Code Smells & Anti-Patterns**
- Functions longer than 50 lines
- Deeply nested conditionals (> 3 levels)
- Magic numbers/strings without named constants
- Duplicated logic that should be extracted
- God functions doing too much (violates SRP)
- Long parameter lists (> 4 params — consider an options object)

**TypeScript Issues**
- Use of `any` — every occurrence must be justified or typed
- Missing type annotations on exported functions
- Unsafe type assertions (`as SomeType`) without runtime validation
- Custom types duplicating existing library types

**Async / Observable Issues** (Angular-specific)
- Missing `takeUntilDestroyed()` on subscriptions in components
- Nested subscriptions instead of `switchMap`/`mergeMap`
- `async/await` mixed with RxJS without proper bridging
- Unhandled promise rejections

**Angular-Specific Anti-Patterns**
- Business logic inside components (should be in services or effects)
- Direct DOM manipulation instead of Angular bindings
- Manual change detection instead of `OnPush` or signals
- Missing loading/error/empty states in component templates
- NgModule usage for new features (should be standalone)

**Next.js-Specific Anti-Patterns**
- Business logic inside Route Handlers (should be in `/lib/services/`)
- Direct external API calls in route handlers (must go through services)
- Missing Zod validation on inputs
- Unhandled errors returning 200 status codes

**Security**
- Hardcoded secrets, API keys, or tokens
- Missing input sanitization
- Sensitive data in console logs
- Exposed internal error details in API responses

**Performance**
- N+1 patterns in data fetching
- Missing memoization on expensive computed values
- Large bundle imports that could be lazy-loaded (Angular: `loadComponent`)

### Phase 3: Best Practices Verification

For every library and framework in use:
1. Verify implementation against current official patterns
2. Identify deviations from Angular 18 and Next.js 14 recommendations
3. Flag deprecated APIs still in use
4. Compare against `docs/backend-standards.md` and `docs/frontend-standards.md`

### Phase 4: Pattern Detection

Look for recurring issues across files:
- Same anti-pattern in multiple components or services
- Inconsistent error handling styles
- Duplicated type definitions
- Inconsistent naming conventions

### Phase 5: Dead Code Detection (Automated)

```bash
# Find unused exports across the codebase
npx knip --reporter json

# TypeScript unused variables/imports (already enforced by tsconfig, verify config)
npx tsc --noEmit --strict
```

**Important:** Always verify tool findings manually before reporting. Check for:
- Dynamic imports (`import(variable)`)
- Angular decorators and DI tokens (may appear "unused" to static tools)
- Re-exports for public API surface
- Entry points (API routes, Angular entry components)

### Phase 6: Comprehensive Report

Generate a report with:

```markdown
## Code Audit Report — data-viewer

**Date**: YYYY-MM-DD
**Scope**: [backend | frontend | full]

### Executive Summary
[2-3 sentence overall assessment]

### Critical Issues (fix immediately)
- [file:line] — [description]

### High Priority (fix before next release)
- [file:line] — [description]

### Medium Priority (technical debt)
- [file:line] — [description]

### Quick Wins (< 30 min each)
- [file:line] — [description]

### File-by-File Findings
[detailed per file]

### Prioritized Action Plan
1. [most impactful fix]
2. ...

### Dead Code to Remove
[list of unused exports, files, dependencies]
```

Save report to `docs/audit-{YYYY-MM-DD}.md`.

## Issue Priority Levels

- **Critical** — Security vulnerabilities, broken functionality, data loss risk
- **High** — Performance bottlenecks, unmaintainable code, missing error handling
- **Medium** — Code quality issues, best practices deviations, missing tests
- **Low** — Style, minor naming issues
- **Quick Win** — < 30 minutes to fix, high clarity improvement

## Resources

See the reference documents for complete methodologies:

- `references/audit-methodology.md` — Full phase-by-phase audit process with detailed checklists
- `references/dead-code-methodology.md` — Dead code detection tools, verification, and cleanup workflows

## Quick Reference Checklist

### Before Starting
- [ ] Read `docs/backend-standards.md` and `docs/frontend-standards.md`
- [ ] Run linters and type checks as baseline
- [ ] Map all source files by layer
- [ ] Create file tracking list

### During Audit
- [ ] Mark files in-progress while analyzing
- [ ] Note specific file and line numbers for every finding
- [ ] Document before/after examples for patterns
- [ ] Mark files completed

### After Audit
- [ ] Categorize all findings by priority
- [ ] Generate comprehensive report
- [ ] Save report to `docs/audit-{YYYY-MM-DD}.md`
- [ ] Provide brief summary in chat
