import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

interface NavLink {
  label: string;
  path: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);
  menuOpen = signal(false);

  navLinks: NavLink[] = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Players', path: '/players' },
    { label: 'Fixture', path: '/fixture' },
  ];

  isLoginPage(): boolean {
    return this.router.url === '/login';
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  logout(): void {
    this.authService.logout();
  }
}
