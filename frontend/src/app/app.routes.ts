import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'players',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/players/players.component').then((m) => m.PlayersComponent),
  },
  {
    path: 'tournament',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/tournament/tournament.component').then((m) => m.TournamentComponent),
  },
  {
    path: 'payments',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/fees/fees.component').then((m) => m.PlayerFeesComponent),
  },
  {
    path: 'admin/users',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/users/users.component').then((m) => m.AdminUsersComponent),
  },
  {
    path: 'admin/payments',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/fees/fees.component').then((m) => m.AdminFeesComponent),
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
];
