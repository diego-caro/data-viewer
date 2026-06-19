import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UserService, CreateUserRequest } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getUsers', () => {
    it('should fetch users list', () => {
      const mockUsers = [
        { id: 'u1', email: 'admin@cec.com', role: 'admin' as const, firstName: 'Admin', lastName: 'CEC', categoryId: null },
      ];

      service.getUsers().subscribe((response) => {
        expect(response.data).toEqual(mockUsers);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/users');
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockUsers });
    });

    it('should propagate error', () => {
      service.getUsers().subscribe({
        error: (err) => {
          expect(err.status).toBe(403);
        },
      });

      const req = httpMock.expectOne('http://localhost:3000/api/users');
      req.flush({ error: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('createUser', () => {
    it('should create a user', () => {
      const request: CreateUserRequest = {
        email: 'player@cec.com',
        password: 'pass123',
        role: 'player',
        firstName: 'Player',
        lastName: 'One',
        categoryId: 'cat-1',
      };
      const mockUser = { id: 'u2', email: 'player@cec.com', role: 'player' as const, firstName: 'Player', lastName: 'One', categoryId: 'cat-1' };

      service.createUser(request).subscribe((response) => {
        expect(response.user).toEqual(mockUser);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/users');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({ user: mockUser });
    });

    it('should propagate 409 conflict error', () => {
      const request: CreateUserRequest = {
        email: 'admin@cec.com',
        password: 'pass123',
        role: 'admin',
        firstName: 'New',
        lastName: 'Admin',
        categoryId: null,
      };

      service.createUser(request).subscribe({
        error: (err) => {
          expect(err.status).toBe(409);
        },
      });

      const req = httpMock.expectOne('http://localhost:3000/api/users');
      req.flush({ error: 'Email already exists' }, { status: 409, statusText: 'Conflict' });
    });
  });
});
