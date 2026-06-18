import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, RouterModule.forRoot([])],
    }).compileComponents();

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

    it('should have links for Dashboard, Players, and Fixture', () => {
      const links = compiled.querySelectorAll('[data-testid="nav-link"]');
      const linkTexts = Array.from(links).map((l) => l.textContent?.trim());
      expect(linkTexts).toContain('Dashboard');
      expect(linkTexts).toContain('Players');
      expect(linkTexts).toContain('Fixture');
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

    it('should have mobile menu links for all pages', () => {
      const hamburger = compiled.querySelector('[data-testid="hamburger-button"]') as HTMLButtonElement;
      hamburger.click();
      fixture.detectChanges();

      const links = compiled.querySelectorAll('[data-testid="mobile-nav-link"]');
      const linkTexts = Array.from(links).map((l) => l.textContent?.trim());
      expect(linkTexts).toContain('Dashboard');
      expect(linkTexts).toContain('Players');
      expect(linkTexts).toContain('Fixture');
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
