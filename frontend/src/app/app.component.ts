import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from './services/auth.service';

interface NavLink {
  labelKey: string;
  path: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  readonly authService = inject(AuthService);
  menuOpen = signal(false);

  commonLinks: NavLink[] = [
    { labelKey: 'NAV.DASHBOARD', path: '/dashboard' },
    { labelKey: 'NAV.TOURNAMENT', path: '/fixture' },
  ];

  nonAdminLinks: NavLink[] = [{ labelKey: 'NAV.MY_FEES', path: '/fees' }];

  adminLinks: NavLink[] = [
    { labelKey: 'NAV.PLAYERS', path: '/players' },
    { labelKey: 'NAV.FEES', path: '/admin/fees' },
    { labelKey: 'NAV.USERS', path: '/admin/users' },
  ];

  constructor() {
    this.translate.addLangs(['es', 'en']);
    const browserLang = this.translate.getBrowserLang();
    const lang = browserLang?.match(/^(es|en)$/) ? browserLang : 'es';
    this.translate.use(lang);
  }

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
