---
description: Frontend development standards, best practices, and conventions for the LTI Angular application including component patterns, state management, UI/UX guidelines, and testing practices
globs: ["frontend/src/**/*.{ts,html,scss,css}", "frontend/cypress/**/*.{ts,js}", "frontend/tsconfig.json", "frontend/cypress.config.ts", "frontend/package.json", "frontend/angular.json"]
alwaysApply: true
---

# Frontend Project Configuration and Best Practices

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
  - [Core Technologies](#core-technologies)
  - [UI Framework](#ui-framework)
  - [State Management & Data Flow](#state-management--data-flow)
  - [Testing Framework](#testing-framework)
  - [Development Tools](#development-tools)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
  - [Language and Naming Conventions](#language-and-naming-conventions)
  - [Component Conventions](#component-conventions)
  - [State Management](#state-management)
  - [Service Layer Architecture](#service-layer-architecture)
- [UI/UX Standards](#uiux-standards)
  - [TailwindCSS Integration](#tailwindcss-integration)
  - [Form Handling](#form-handling)
  - [Navigation Patterns](#navigation-patterns)
  - [Accessibility](#accessibility)
- [Testing Standards](#testing-standards)
  - [End-to-End Testing with Cypress](#end-to-end-testing-with-cypress)
  - [Unit Testing with Jest](#unit-testing-with-jest)
  - [Test Organization](#test-organization)
- [Configuration Standards](#configuration-standards)
  - [TypeScript Configuration](#typescript-configuration)
  - [ESLint Configuration](#eslint-configuration)
  - [Environment Configuration](#environment-configuration)
- [Performance Best Practices](#performance-best-practices)
  - [Component Optimization](#component-optimization)
  - [Bundle Optimization](#bundle-optimization)
  - [API Efficiency](#api-efficiency)
- [Development Workflow](#development-workflow)
  - [Git Workflow](#git-workflow)
  - [Development Scripts](#development-scripts)
  - [Code Quality](#code-quality)
- [Migration Strategy](#migration-strategy)
  - [Component Modernization](#component-modernization)

---

## Overview

This document outlines the best practices, conventions, and standards used in the LTI frontend application. These practices ensure code consistency, maintainability, and optimal development experience.

## Technology Stack

### Core Technologies
- **Angular 18**: Modern Angular with standalone components
- **TypeScript 5.4**: For type safety and better development experience
- **Angular CLI**: Build tooling, development server, and code generation
- **Angular Router**: Client-side routing and navigation

### UI Framework
- **TailwindCSS 3**: Utility-first CSS framework for responsive design
- **Headless UI (Angular CDK)**: Unstyled, accessible UI primitives
- **Angular CDK**: Component Dev Kit for drag-and-drop, overlays, and more

### State Management & Data Flow
- **NgRx Store**: Global state management with Redux pattern
- **NgRx Effects**: Side effect handling for async operations
- **NgRx Selectors**: Memoized state queries
- **RxJS**: Reactive programming for async operations and data streams
- **HttpClient**: Built-in HTTP client for API communication

### Testing Framework
- **Cypress 14.4.1**: End-to-end testing
- **Jest**: Unit testing
- **Angular Testing Utilities**: Component testing with TestBed

### Development Tools
- **ESLint + angular-eslint**: Code linting with Angular-specific rules
- **TypeScript**: Static type checking
- **Angular DevTools**: Browser extension for debugging
- **TailwindCSS IntelliSense**: IDE support for Tailwind classes

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── components/        # Reusable UI components
│   │   ├── services/          # API and shared services
│   │   ├── pages/             # Routed page components
│   │   ├── models/            # TypeScript interfaces and types
│   │   ├── guards/            # Route guards
│   │   ├── interceptors/      # HTTP interceptors
│   │   ├── pipes/             # Custom pipes
│   │   ├── directives/        # Custom directives
│   │   ├── store/             # NgRx store
│   │   │   ├── actions/       # NgRx actions
│   │   │   ├── effects/       # NgRx effects
│   │   │   ├── reducers/      # NgRx reducers
│   │   │   └── selectors/     # NgRx selectors
│   │   ├── app.component.ts   # Root component
│   │   ├── app.config.ts      # Application configuration
│   │   └── app.routes.ts      # Route definitions
│   ├── assets/                # Images, fonts, static resources
│   ├── environments/          # Environment configurations
│   ├── styles.scss            # Global styles and Tailwind imports
│   ├── index.html             # Main HTML file
│   └── main.ts                # Application entry point
├── cypress/
│   └── e2e/                   # End-to-end test files
├── angular.json               # Angular workspace configuration
├── tailwind.config.js         # TailwindCSS configuration
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── jest.config.ts             # Jest configuration
└── cypress.config.ts          # Cypress configuration
```

## Coding Standards

### Naming Conventions

- **Component Naming**: Use PascalCase for component classes with a descriptive suffix (e.g., `CandidateCardComponent`, `PositionDetailsComponent`, `RecruiterDashboardComponent`)
- **Selector Naming**: Use kebab-case with an `app-` prefix for component selectors (e.g., `app-candidate-card`, `app-position-details`)
- **Variable Naming**: Use camelCase for variables and functions (e.g., `candidateId`, `handleSubmit`, `fetchPositions`)
- **Constants Naming**: Use UPPER_SNAKE_CASE for constants (e.g., `MAX_CANDIDATES_PER_PAGE`, `API_BASE_URL`)
- **Type/Interface Naming**: Use PascalCase for types and interfaces (e.g., `CandidateData`, `PositionProps`, `ICandidateService`)
- **File Naming**: Use kebab-case with type suffix (e.g., `candidate-card.component.ts`, `candidate.service.ts`, `candidate.model.ts`, `auth.guard.ts`)
- **NgRx Naming**: Use `[Source] Event Description` for actions (e.g., `[Positions Page] Load Positions`, `[Positions API] Load Positions Success`)
- **Observable Naming**: Use camelCase with a `$` suffix for observables (e.g., `candidates$`, `positionData$`)

**Examples:**

```typescript
// Good: All in English
import { Component, Input, Output, EventEmitter } from '@angular/core';

interface CandidateCardProps {
    candidate: Candidate;
    index: number;
}

@Component({
    selector: 'app-candidate-card',
    standalone: true,
    templateUrl: './candidate-card.component.html',
    styleUrl: './candidate-card.component.scss'
})
export class CandidateCardComponent {
    @Input({ required: true }) candidate!: Candidate;
    @Input() index = 0;
    @Output() cardClick = new EventEmitter<Candidate>();

    isLoading = false;

    handleCardClick(): void {
        this.cardClick.emit(this.candidate);
    }
}

// Avoid: Non-English comments or names
@Component({ selector: 'app-tarjeta-candidato' })
export class TarjetaCandidatoComponent {
    @Input() candidato!: Candidato;
    @Input() indice = 0;
    @Output() alHacerClic = new EventEmitter<Candidato>();

    estaCargando = false;

    // Manejar evento de clic en la tarjeta de candidato
    manejarClicTarjeta(): void {
        this.alHacerClic.emit(this.candidato);
    }
}
```

**Error Messages and Console Logs:**

```typescript
// Good: English error messages
catch (error) {
    console.error('Failed to fetch candidates:', error);
    this.errorMessage = 'Unable to load candidates. Please try again later.';
}

// Avoid: Non-English messages
catch (error) {
    console.error('Error al obtener candidatos:', error);
    this.errorMessage = 'No se pudieron cargar los candidatos. Por favor, inténtelo de nuevo más tarde.';
}
```

**Service Layer Examples:**

```typescript
// Good: English naming in services
@Injectable({ providedIn: 'root' })
export class CandidateService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiBaseUrl}/candidates`;

    getAllCandidates(): Observable<Candidate[]> {
        return this.http.get<Candidate[]>(this.apiUrl).pipe(
            catchError(error => {
                console.error('Error fetching candidates:', error);
                throw error;
            })
        );
    }
}

// Avoid: Non-English naming
@Injectable({ providedIn: 'root' })
export class ServicioCandidatos {
    obtenerTodosLosCandidatos(): Observable<Candidato[]> {
        return this.http.get<Candidato[]>(this.apiUrl).pipe(
            catchError(error => {
                console.error('Error al obtener candidatos:', error);
                throw error;
            })
        );
    }
}
```

### Component Conventions

#### Standalone Components
- **Always use standalone components** (Angular 18 default)
- **Use TypeScript** for all components
- **Use `inject()` function** instead of constructor injection

```typescript
import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectAllPositions, selectPositionsLoading } from '../../store/selectors/position.selectors';
import { PositionActions } from '../../store/actions/position.actions';

interface Position {
    id: number;
    title: string;
    status: 'Open' | 'Hired' | 'Closed' | 'Draft';
}

@Component({
    selector: 'app-positions',
    standalone: true,
    imports: [CommonModule, AsyncPipe],
    templateUrl: './positions.component.html',
    styleUrl: './positions.component.scss'
})
export class PositionsComponent implements OnInit {
    private readonly store = inject(Store);

    positions$ = this.store.select(selectAllPositions);
    loading$ = this.store.select(selectPositionsLoading);

    ngOnInit(): void {
        this.store.dispatch(PositionActions.loadPositions());
    }
}
```

#### Component Inputs and Outputs
- **Use `@Input()` and `@Output()` decorators**
- **Mark required inputs** with `{ required: true }`
- **Use `EventEmitter`** for outputs

```typescript
@Component({
    selector: 'app-candidate-card',
    standalone: true,
    templateUrl: './candidate-card.component.html'
})
export class CandidateCardComponent {
    @Input({ required: true }) candidate!: Candidate;
    @Input() index = 0;
    @Output() cardClick = new EventEmitter<Candidate>();
}
```

### State Management

#### NgRx Store Pattern

**Actions:**
```typescript
// store/actions/position.actions.ts
import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const PositionActions = createActionGroup({
    source: 'Positions Page',
    events: {
        'Load Positions': emptyProps(),
        'Load Positions Success': props<{ positions: Position[] }>(),
        'Load Positions Failure': props<{ error: string }>(),
        'Update Position': props<{ id: number; changes: Partial<Position> }>(),
        'Update Position Success': props<{ position: Position }>(),
        'Update Position Failure': props<{ error: string }>(),
    }
});
```

**Reducers:**
```typescript
// store/reducers/position.reducer.ts
import { createReducer, on } from '@ngrx/store';
import { PositionActions } from '../actions/position.actions';

export interface PositionState {
    positions: Position[];
    loading: boolean;
    error: string | null;
}

const initialState: PositionState = {
    positions: [],
    loading: false,
    error: null
};

export const positionReducer = createReducer(
    initialState,
    on(PositionActions.loadPositions, (state) => ({
        ...state,
        loading: true,
        error: null
    })),
    on(PositionActions.loadPositionsSuccess, (state, { positions }) => ({
        ...state,
        positions,
        loading: false
    })),
    on(PositionActions.loadPositionsFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    }))
);
```

**Effects:**
```typescript
// store/effects/position.effects.ts
import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap, of } from 'rxjs';
import { PositionService } from '../../services/position.service';
import { PositionActions } from '../actions/position.actions';

@Injectable()
export class PositionEffects {
    private readonly actions$ = inject(Actions);
    private readonly positionService = inject(PositionService);

    loadPositions$ = createEffect(() =>
        this.actions$.pipe(
            ofType(PositionActions.loadPositions),
            switchMap(() =>
                this.positionService.getAllPositions().pipe(
                    map(positions => PositionActions.loadPositionsSuccess({ positions })),
                    catchError(error => of(PositionActions.loadPositionsFailure({ error: error.message })))
                )
            )
        )
    );
}
```

**Selectors:**
```typescript
// store/selectors/position.selectors.ts
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PositionState } from '../reducers/position.reducer';

export const selectPositionState = createFeatureSelector<PositionState>('positions');

export const selectAllPositions = createSelector(
    selectPositionState,
    (state) => state.positions
);

export const selectPositionsLoading = createSelector(
    selectPositionState,
    (state) => state.loading
);

export const selectPositionsError = createSelector(
    selectPositionState,
    (state) => state.error
);

export const selectPositionById = (id: number) => createSelector(
    selectAllPositions,
    (positions) => positions.find(p => p.id === id)
);
```

#### When to Use NgRx vs Local State
- **Use NgRx** for shared state across multiple components, server-fetched data, and state that needs to survive navigation
- **Use component-level state** for UI-only concerns like form inputs, toggles, and local loading indicators

### Service Layer Architecture

#### API Services
- **Centralize API calls** in injectable services
- Use **HttpClient** for HTTP requests
- **Return Observables** from service methods
- **Handle errors** with RxJS `catchError` operator

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PositionService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiBaseUrl}/positions`;

    getAllPositions(): Observable<Position[]> {
        return this.http.get<Position[]>(this.apiUrl).pipe(
            catchError(error => {
                console.error('Error fetching positions:', error);
                throw error;
            })
        );
    }

    updatePosition(id: number, positionData: Partial<Position>): Observable<Position> {
        return this.http.put<Position>(`${this.apiUrl}/${id}`, positionData).pipe(
            catchError(error => {
                console.error('Error updating position:', error);
                throw error;
            })
        );
    }
}
```

## UI/UX Standards

### TailwindCSS Integration
- Use **TailwindCSS utility classes** for styling
- **Configure Tailwind** in `tailwind.config.js` with project-specific theme extensions
- **Import Tailwind directives** in `styles.scss`
- **Extract reusable patterns** with `@apply` in component stylesheets only when necessary
- **Use responsive prefixes** (`sm:`, `md:`, `lg:`, `xl:`) for responsive design

```scss
// styles.scss
@tailwind base;
@tailwind components;
@tailwind utilities;
```

```html
<!-- In templates -->
<div class="container mx-auto px-4">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="rounded-lg border bg-white p-6 shadow-sm">
            <h3 class="text-lg font-semibold text-gray-900">{{ position.title }}</h3>
            <p class="mt-2 text-sm text-gray-600">{{ position.description }}</p>
            <span class="mt-3 inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                {{ position.status }}
            </span>
        </div>
    </div>
</div>
```

```javascript
// tailwind.config.js
module.exports = {
    content: ['./src/**/*.{html,ts}'],
    theme: {
        extend: {
            colors: {
                primary: { /* project palette */ },
            },
        },
    },
    plugins: [],
};
```

### Form Handling
- Use **Angular Reactive Forms** for complex forms
- Use **Template-driven forms** for simple forms
- Implement **real-time validation** with built-in validators
- **Disable submit buttons** during form submission
- **Reset form state** after successful submission

```typescript
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
    standalone: true,
    imports: [ReactiveFormsModule],
    template: `
        <form [formGroup]="form" (ngSubmit)="handleSubmit()" class="space-y-4">
            <div>
                <label for="title" class="block text-sm font-medium text-gray-700">Title *</label>
                <input
                    id="title"
                    type="text"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    formControlName="title"
                />
            </div>
            <button
                type="submit"
                class="rounded-md bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50"
                [disabled]="saving"
            >
                {{ saving ? 'Saving...' : 'Save' }}
            </button>
        </form>
    `
})
export class PositionFormComponent {
    private readonly fb = inject(FormBuilder);
    saving = false;

    form = this.fb.group({
        title: ['', Validators.required],
        description: [''],
        status: ['Draft']
    });

    handleSubmit(): void {
        if (this.form.valid) {
            // Submit logic
        }
    }
}
```

### Navigation Patterns
- Use **Angular Router** for all navigation
- **Implement breadcrumbs** with back navigation
- Use **programmatic navigation** with Router service

```typescript
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
    standalone: true,
    imports: [RouterLink],
    template: `
        <button class="text-primary-600 hover:text-primary-800 text-sm font-medium" (click)="goBack()">
            &larr; Back to Dashboard
        </button>
        <a routerLink="/positions" class="text-primary-600 hover:underline">Positions</a>
    `
})
export class PositionDetailsComponent {
    private readonly router = inject(Router);

    goBack(): void {
        this.router.navigate(['/']);
    }
}
```

### Accessibility
- Include **aria-label** attributes for interactive elements
- Use **semantic HTML** elements
- Ensure **keyboard navigation** support
- Provide **alternative text** for images

```html
<input
    type="text"
    class="block w-full rounded-md border-gray-300 shadow-sm"
    placeholder="Search by title"
    aria-label="Search positions by title"
/>
```

## Testing Standards

### End-to-End Testing with Cypress
- **Test user workflows** rather than implementation details
- Use **data-testid** attributes for reliable element selection
- **Organize tests by feature** (candidates.cy.ts, positions.cy.ts)
- **Include API testing** alongside UI testing

```typescript
describe('Positions API - Update', () => {
    beforeEach(() => {
        cy.window().then((win) => {
            win.localStorage.clear();
        });
    });

    it('should update a position successfully', () => {
        const updateData = {
            title: 'Updated Test Position',
            status: 'Open'
        };

        cy.request({
            method: 'PUT',
            url: `${API_URL}/positions/${testPositionId}`,
            body: updateData
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body.data.title).to.eq(updateData.title);
        });
    });
});
```

### Unit Testing with Jest
- Use **Jest** as the test runner and assertion library
- Use **TestBed** for component and service testing
- **Mock dependencies** with Jest mocks and spies
- **Test component logic** independently from the template

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PositionService } from './position.service';

describe('PositionService', () => {
    let service: PositionService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule]
        });
        service = TestBed.inject(PositionService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should fetch all positions', () => {
        const mockPositions: Position[] = [
            { id: 1, title: 'Developer', status: 'Open' }
        ];

        service.getAllPositions().subscribe(positions => {
            expect(positions).toEqual(mockPositions);
        });

        const req = httpMock.expectOne('/api/positions');
        expect(req.request.method).toBe('GET');
        req.flush(mockPositions);
    });
});
```

**Testing NgRx:**

```typescript
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { PositionEffects } from './position.effects';
import { PositionActions } from '../actions/position.actions';
import { PositionService } from '../../services/position.service';

describe('PositionEffects', () => {
    let effects: PositionEffects;
    let actions$: Observable<any>;
    let positionService: jest.Mocked<PositionService>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                PositionEffects,
                provideMockActions(() => actions$),
                provideMockStore(),
                {
                    provide: PositionService,
                    useValue: { getAllPositions: jest.fn() }
                }
            ]
        });

        effects = TestBed.inject(PositionEffects);
        positionService = TestBed.inject(PositionService) as jest.Mocked<PositionService>;
    });

    it('should load positions successfully', (done) => {
        const mockPositions: Position[] = [{ id: 1, title: 'Dev', status: 'Open' }];
        positionService.getAllPositions.mockReturnValue(of(mockPositions));
        actions$ = of(PositionActions.loadPositions());

        effects.loadPositions$.subscribe(action => {
            expect(action).toEqual(PositionActions.loadPositionsSuccess({ positions: mockPositions }));
            done();
        });
    });
});
```

### Test Organization
- **Group related tests** with describe blocks
- **Use descriptive test names** that explain the expected behavior
- **Test both success and error scenarios**
- **Include edge cases** and validation testing

## Configuration Standards

### TypeScript Configuration
- Enable **strict mode** for type checking
- Use **path mapping** with `@/*` for cleaner imports
- Configure **ES2022 target** for modern output

```json
{
    "compilerOptions": {
        "strict": true,
        "baseUrl": ".",
        "paths": {
            "@/*": ["src/*"]
        },
        "target": "ES2022",
        "module": "ES2022"
    }
}
```

### ESLint Configuration
- Extend **angular-eslint** configuration
- Include **TypeScript-specific rules**
- **Automatic code formatting** and error detection
- **Consistent code style** across the project

### Environment Configuration
- Use **Angular environment files** for API URLs
- **Separate configurations** for development and production
- **Configure Cypress** with environment-specific settings

```typescript
// environments/environment.ts
export const environment = {
    production: false,
    apiBaseUrl: 'http://localhost:3010'
};

// environments/environment.prod.ts
export const environment = {
    production: true,
    apiBaseUrl: '/api'
};
```

```typescript
// cypress.config.ts
export default defineConfig({
    e2e: {
        baseUrl: 'http://localhost:4200',
        env: {
            API_URL: 'http://localhost:3010'
        }
    }
});
```

## Performance Best Practices

### Component Optimization
- **Use `OnPush` change detection** for presentational components
- **Lazy load** route modules
- **Use `trackBy`** in `@for` loops
- **Unsubscribe** from observables with `takeUntilDestroyed` or `AsyncPipe`

```typescript
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush
})
```

```html
@for (item of items$ | async; track item.id) {
    <app-item-card [item]="item" />
}
```

### Bundle Optimization
- **Tree shaking** enabled through Angular CLI
- **Lazy loading** at route level with `loadComponent`
- **Optimize images** and static assets
- **Monitor bundle size** with `ng build --stats-json`
- **Purge unused TailwindCSS classes** via content configuration

```typescript
// app.routes.ts
export const routes: Routes = [
    {
        path: 'positions',
        loadComponent: () => import('./pages/positions/positions.component')
            .then(m => m.PositionsComponent)
    }
];
```

### API Efficiency
- **Implement proper error handling** for network requests
- **Cache API responses** with RxJS `shareReplay`
- **Use loading states** to improve perceived performance
- **Cancel pending requests** with `takeUntilDestroyed`

## Development Workflow

- **Feature Branches**: Develop features in separate branches, adding descriptive suffix "-frontend" to allow working in parallel and avoid conflicts or collisions
- **Descriptive Commits**: Write descriptive commit messages in English
- **Code Review**: Code review before merging
- **Small Branches**: Keep branches small and focused

### Development Scripts
```bash
ng serve              # Development server (port 4200)
ng test               # Run unit tests with Jest
ng build              # Production build
ng generate           # Generate components, services, etc.
npx cypress open      # Open Cypress test runner
npx cypress run       # Run Cypress tests headlessly
ng lint               # Run ESLint
```

### Code Quality
- **ESLint validation** before commits
- **TypeScript compilation** without errors
- **All tests passing** before deployment
- **Bundle size monitoring** with Angular CLI

## Migration Strategy

### Component Modernization
- **Standalone components** for all new components
- **`inject()` function** instead of constructor injection
- **Control flow syntax** (`@if`, `@for`, `@switch`) instead of structural directives
- **NgRx Store** for shared state management
- **Responsive design** with TailwindCSS utility classes throughout

This document serves as the foundation for maintaining code quality and consistency across the LTI frontend application. All team members should follow these practices to ensure a maintainable and scalable codebase.
