import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of } from 'rxjs';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();
  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  if (authService.isAuthenticated()) {
    if (authService.user()?.role === 'admin') return true;
    router.navigate(['/dashboard']);
    return false;
  }

  return authService.loadCurrentUser().pipe(
    map(() => {
      if (authService.user()?.role === 'admin') return true;
      router.navigate(['/dashboard']);
      return false;
    }),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    }),
  );
};
