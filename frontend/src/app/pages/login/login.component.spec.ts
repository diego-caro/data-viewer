import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { provideTranslateTesting, setupTestTranslations } from '../../testing/translate-testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { LoginResponse } from '../../models/user.model';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jest.Mocked<AuthService>;
  let router: Router;

  const mockLoginResponse: LoginResponse = {
    token: 'jwt-token',
    user: {
      id: 'user-1',
      email: 'admin@cec.com',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'CEC',
      categoryId: null,
    },
  };

  beforeEach(async () => {
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

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        provideRouter([
          { path: 'dashboard', component: LoginComponent },
          { path: 'login', component: LoginComponent },
        ]),
        ...provideTranslateTesting(),
      ],
    }).compileComponents();

    setupTestTranslations(TestBed.inject(TranslateService));
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jest.Mocked<AuthService>;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should render login form', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="login-form"]')).toBeTruthy();
    expect(compiled.querySelector('[data-testid="email-input"]')).toBeTruthy();
    expect(compiled.querySelector('[data-testid="password-input"]')).toBeTruthy();
    expect(compiled.querySelector('[data-testid="login-button"]')).toBeTruthy();
  });

  it('should render Sign In title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Sign In');
  });

  it('should render CEC logo', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const img = compiled.querySelector('img');
    expect(img?.getAttribute('src')).toBe('logo-cec.png');
    expect(img?.getAttribute('alt')).toBe('CEC Logo');
  });

  it('should disable submit button when fields are empty', () => {
    const button = fixture.nativeElement.querySelector('[data-testid="login-button"]') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('should enable submit button when fields are filled', () => {
    component.email = 'admin@cec.com';
    component.password = 'admin123';
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('[data-testid="login-button"]') as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  it('should call authService.login on submit', fakeAsync(() => {
    authService.login.mockReturnValue(of(mockLoginResponse));
    const navigateSpy = jest.spyOn(router, 'navigate');

    component.email = 'admin@cec.com';
    component.password = 'admin123';
    component.onSubmit();
    tick();

    expect(authService.login).toHaveBeenCalledWith('admin@cec.com', 'admin123');
    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
  }));

  it('should show error on 401 response', fakeAsync(() => {
    const error = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
    authService.login.mockReturnValue(throwError(() => error));

    component.email = 'admin@cec.com';
    component.password = 'wrong';
    component.onSubmit();
    tick();
    fixture.detectChanges();

    expect(component.error()).toBe('Invalid email or password');
    const errorEl = fixture.nativeElement.querySelector('[data-testid="login-error"]');
    expect(errorEl?.textContent).toContain('Invalid email or password');
  }));

  it('should show generic error on non-401 error', fakeAsync(() => {
    const error = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });
    authService.login.mockReturnValue(throwError(() => error));

    component.email = 'admin@cec.com';
    component.password = 'admin123';
    component.onSubmit();
    tick();
    fixture.detectChanges();

    expect(component.error()).toBe('An unexpected error occurred. Please try again.');
  }));

  it('should show loading state during login', fakeAsync(() => {
    authService.login.mockReturnValue(of(mockLoginResponse));

    component.email = 'admin@cec.com';
    component.password = 'admin123';

    expect(component.loading()).toBe(false);
    component.onSubmit();
    expect(component.loading()).toBe(true);
  }));

  it('should clear error before new login attempt', fakeAsync(() => {
    const error = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
    authService.login.mockReturnValue(throwError(() => error));

    component.email = 'admin@cec.com';
    component.password = 'wrong';
    component.onSubmit();
    tick();

    expect(component.error()).toBe('Invalid email or password');

    authService.login.mockReturnValue(of(mockLoginResponse));
    component.onSubmit();

    expect(component.error()).toBeNull();
  }));

  it('should not show error initially', () => {
    const errorEl = fixture.nativeElement.querySelector('[data-testid="login-error"]');
    expect(errorEl).toBeNull();
  });

  it('should set loading to false after error', fakeAsync(() => {
    const error = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
    authService.login.mockReturnValue(throwError(() => error));

    component.email = 'admin@cec.com';
    component.password = 'wrong';
    component.onSubmit();
    tick();

    expect(component.loading()).toBe(false);
  }));
});
