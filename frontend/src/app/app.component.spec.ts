import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateService } from '@ngx-translate/core';
import { AppComponent } from './app.component';
import { AuthService } from './services/auth.service';
import { provideTranslateTesting, setupTestTranslations } from './testing/translate-testing';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let compiled: HTMLElement;

  const authServiceMock = {
    login: jest.fn(),
    logout: jest.fn(),
    isAuthenticated: jest.fn().mockReturnValue(false),
    userName: jest.fn().mockReturnValue(''),
    getToken: jest.fn().mockReturnValue(null),
    user: jest.fn().mockReturnValue(null),
    loadCurrentUser: jest.fn(),
    clearAuth: jest.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, RouterModule.forRoot([])],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceMock },
        ...provideTranslateTesting(),
      ],
    }).compileComponents();

    setupTestTranslations(TestBed.inject(TranslateService));
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    compiled = fixture.nativeElement as HTMLElement;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  describe('navigation bar', () => {
    it('should render the nav bar', () => {
      expect(compiled.querySelector('[data-testid="nav-bar"]')).toBeTruthy();
    });

    it('should display the CEC logo', () => {
      const logo = compiled.querySelector('[data-testid="nav-logo"]') as HTMLImageElement;
      expect(logo).toBeTruthy();
      expect(logo.src).toContain('logo-cec.png');
      expect(logo.alt).toBeTruthy();
    });

    it('should have common links for Dashboard and Tournament', () => {
      const links = compiled.querySelectorAll('[data-testid="nav-link"]');
      const linkTexts = Array.from(links).map((l) => l.textContent?.trim());
      expect(linkTexts).toContain('Dashboard');
      expect(linkTexts).toContain('Tournament');
    });

    it('should show admin links when user is admin', () => {
      authServiceMock.isAuthenticated.mockReturnValue(true);
      authServiceMock.user.mockReturnValue({ role: 'admin' });
      fixture.detectChanges();
      compiled = fixture.nativeElement as HTMLElement;

      const adminLinks = compiled.querySelectorAll('[data-testid="admin-nav-link"]');
      const linkTexts = Array.from(adminLinks).map((l) => l.textContent?.trim());
      expect(linkTexts).toContain('Players');
      expect(linkTexts).toContain('Payments');
      expect(linkTexts).toContain('Users');
    });

    it('should show non-admin links when user is player', () => {
      authServiceMock.isAuthenticated.mockReturnValue(true);
      authServiceMock.user.mockReturnValue({ role: 'player' });
      fixture.detectChanges();
      compiled = fixture.nativeElement as HTMLElement;

      const nonAdminLinks = compiled.querySelectorAll('[data-testid="nonAdmin-nav-link"]');
      const linkTexts = Array.from(nonAdminLinks).map((l) => l.textContent?.trim());
      expect(linkTexts).toContain('My Payments');
    });
  });

  describe('hamburger menu (mobile)', () => {
    it('should render the hamburger button', () => {
      const hamburger = compiled.querySelector('[data-testid="hamburger-button"]');
      expect(hamburger).toBeTruthy();
    });

    it('should have mobile menu hidden by default', () => {
      const mobileMenu = compiled.querySelector('[data-testid="mobile-menu"]');
      expect(mobileMenu).toBeNull();
    });

    it('should show mobile menu when hamburger is clicked', () => {
      const hamburger = compiled.querySelector('[data-testid="hamburger-button"]') as HTMLButtonElement;
      hamburger.click();
      fixture.detectChanges();

      const mobileMenu = compiled.querySelector('[data-testid="mobile-menu"]');
      expect(mobileMenu).toBeTruthy();
    });

    it('should have mobile menu common links', () => {
      const hamburger = compiled.querySelector('[data-testid="hamburger-button"]') as HTMLButtonElement;
      hamburger.click();
      fixture.detectChanges();

      const links = compiled.querySelectorAll('[data-testid="mobile-nav-link"]');
      const linkTexts = Array.from(links).map((l) => l.textContent?.trim());
      expect(linkTexts).toContain('Dashboard');
      expect(linkTexts).toContain('Tournament');
    });

    it('should close mobile menu when a link is clicked', () => {
      const hamburger = compiled.querySelector('[data-testid="hamburger-button"]') as HTMLButtonElement;
      hamburger.click();
      fixture.detectChanges();

      const firstLink = compiled.querySelector('[data-testid="mobile-nav-link"]') as HTMLAnchorElement;
      firstLink.click();
      fixture.detectChanges();

      const mobileMenu = compiled.querySelector('[data-testid="mobile-menu"]');
      expect(mobileMenu).toBeNull();
    });

    it('should toggle mobile menu on repeated hamburger clicks', () => {
      const hamburger = compiled.querySelector('[data-testid="hamburger-button"]') as HTMLButtonElement;

      hamburger.click();
      fixture.detectChanges();
      expect(compiled.querySelector('[data-testid="mobile-menu"]')).toBeTruthy();

      hamburger.click();
      fixture.detectChanges();
      expect(compiled.querySelector('[data-testid="mobile-menu"]')).toBeNull();
    });
  });

  describe('menuOpen signal', () => {
    it('should default to false', () => {
      expect(component.menuOpen()).toBe(false);
    });

    it('should toggle when toggleMenu is called', () => {
      component.toggleMenu();
      expect(component.menuOpen()).toBe(true);

      component.toggleMenu();
      expect(component.menuOpen()).toBe(false);
    });

    it('should set to false when closeMenu is called', () => {
      component.toggleMenu();
      expect(component.menuOpen()).toBe(true);

      component.closeMenu();
      expect(component.menuOpen()).toBe(false);
    });
  });
});
