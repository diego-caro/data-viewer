import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'players',
    loadComponent: () =>
      import('./pages/players/players.component').then(
        (m) => m.PlayersComponent,
      ),
  },
  { path: '', redirectTo: 'players', pathMatch: 'full' },
];
