import { Routes } from '@angular/router';

export const routes: Routes = [
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
  { path: '', redirectTo: 'players', pathMatch: 'full' },
];
