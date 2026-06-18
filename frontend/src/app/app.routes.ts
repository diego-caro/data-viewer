import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent,
      ),
  },
  {
    path: 'players',
    loadComponent: () =>
      import('./pages/players/players.component').then(
        (m) => m.PlayersComponent,
      ),
  },
  {
    path: 'fixture',
    loadComponent: () =>
      import('./pages/fixture/fixture.component').then(
        (m) => m.FixtureComponent,
      ),
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
];
