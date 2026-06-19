import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent,
      ),
  },
  {
    path: 'players',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/players/players.component').then(
        (m) => m.PlayersComponent,
      ),
  },
  {
    path: 'fixture',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/fixture/fixture.component').then(
        (m) => m.FixtureComponent,
      ),
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
];
