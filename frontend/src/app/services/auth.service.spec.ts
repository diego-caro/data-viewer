import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { LoginResponse } from '../models/user.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  const mockLoginResponse: LoginResponse = {
    token: 'jwt-token-123',
    user: {
      id: 'user-1',
      email: 'admin@cec.com',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'CEC',
      categoryId: null,
    },
  };

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('login', () => {
    it('should store token and set current user on success', () => {
      service.login('admin@cec.com', 'admin123').subscribe((response) => {
        expect(response.token).toBe('jwt-token-123');
        expect(localStorage.getItem('auth_token')).toBe('jwt-token-123');
        expect(service.isAuthenticated()).toBe(true);
        expect(service.userName()).toBe('Admin CEC');
      });

      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'admin@cec.com', password: 'admin123' });
      req.flush(mockLoginResponse);
    });

    it('should propagate error on failed login', () => {
      service.login('admin@cec.com', 'wrong').subscribe({
        error: (err) => {
          expect(err.status).toBe(401);
          expect(service.isAuthenticated()).toBe(false);
        },
      });

      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      req.flush({ error: 'Invalid email or password' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('logout', () => {
    it('should clear token and navigate to login', () => {
      const navigateSpy = jest.spyOn(router, 'navigate');
      localStorage.setItem('auth_token', 'some-token');

      service.logout();

      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('loadCurrentUser', () => {
    it('should set current user on success', () => {
      localStorage.setItem('auth_token', 'valid-token');

      service.loadCurrentUser().subscribe((response) => {
        expect(response.user.email).toBe('admin@cec.com');
        expect(service.isAuthenticated()).toBe(true);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/auth/me');
      expect(req.request.method).toBe('GET');
      req.flush({ user: mockLoginResponse.user });
    });

    it('should clear auth on failure', () => {
      localStorage.setItem('auth_token', 'expired-token');

      service.loadCurrentUser().subscribe({
        error: () => {
          expect(localStorage.getItem('auth_token')).toBeNull();
          expect(service.isAuthenticated()).toBe(false);
        },
      });

      const req = httpMock.expectOne('http://localhost:3000/api/auth/me');
      req.flush({ error: 'Invalid token' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('getToken', () => {
    it('should return token from localStorage', () => {
      localStorage.setItem('auth_token', 'my-token');
      expect(service.getToken()).toBe('my-token');
    });

    it('should return null when no token', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should be false initially', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should be true after login', () => {
      service.login('admin@cec.com', 'admin123').subscribe();

      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      req.flush(mockLoginResponse);

      expect(service.isAuthenticated()).toBe(true);
    });
  });

  describe('userName', () => {
    it('should be empty string when not authenticated', () => {
      expect(service.userName()).toBe('');
    });

    it('should return full name when authenticated', () => {
      service.login('admin@cec.com', 'admin123').subscribe();

      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      req.flush(mockLoginResponse);

      expect(service.userName()).toBe('Admin CEC');
    });
  });
});
