import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminUsersComponent } from './users.component';
import { UserService } from '../../../services/user.service';
import { PlayerService } from '../../../services/player.service';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

describe('AdminUsersComponent', () => {
  let component: AdminUsersComponent;
  let fixture: ComponentFixture<AdminUsersComponent>;
  let userService: jest.Mocked<UserService>;
  let playerService: jest.Mocked<PlayerService>;

  const mockUsers = [
    { id: 'u1', email: 'admin@cec.com', role: 'admin' as const, firstName: 'Admin', lastName: 'CEC', categoryId: null },
    { id: 'u2', email: 'player@cec.com', role: 'player' as const, firstName: 'Player', lastName: 'One', categoryId: 'cat-1' },
  ];

  const mockCategories = [
    { id: 'cat-1', name: 'Mixto Sub 14 A' },
    { id: 'cat-2', name: 'Mixto Sub 14 B' },
  ];

  beforeEach(async () => {
    const userServiceMock = {
      getUsers: jest.fn().mockReturnValue(of({ data: mockUsers })),
      createUser: jest.fn(),
    };

    const playerServiceMock = {
      getCategories: jest.fn().mockReturnValue(of(mockCategories)),
      getPlayersByCategory: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AdminUsersComponent],
      providers: [
        { provide: UserService, useValue: userServiceMock },
        { provide: PlayerService, useValue: playerServiceMock },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminUsersComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService) as jest.Mocked<UserService>;
    playerService = TestBed.inject(PlayerService) as jest.Mocked<PlayerService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display users table after loading', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="users-table"]')).toBeTruthy();
    expect(compiled.querySelectorAll('[data-testid="user-row"]')).toHaveLength(2);
  });

  it('should display user details in table rows', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const rows = compiled.querySelectorAll('[data-testid="user-row"]');
    expect(rows[0].textContent).toContain('CEC');
    expect(rows[0].textContent).toContain('admin@cec.com');
    expect(rows[0].textContent).toContain('admin');
  });

  it('should show role badges', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const badges = compiled.querySelectorAll('[data-testid="role-badge"]');
    expect(badges).toHaveLength(2);
    expect(badges[0].textContent?.trim()).toBe('admin');
    expect(badges[1].textContent?.trim()).toBe('player');
  });

  it('should show error state when loading fails', () => {
    userService.getUsers.mockReturnValue(throwError(() => new Error('fail')));

    const newFixture = TestBed.createComponent(AdminUsersComponent);
    newFixture.detectChanges();
    const compiled = newFixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('[data-testid="error-state"]')).toBeTruthy();
  });

  it('should show empty state when no users', () => {
    userService.getUsers.mockReturnValue(of({ data: [] }));

    const newFixture = TestBed.createComponent(AdminUsersComponent);
    newFixture.detectChanges();
    const compiled = newFixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('[data-testid="empty-state"]')).toBeTruthy();
  });

  describe('create user form', () => {
    it('should not show form initially', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('[data-testid="user-form"]')).toBeNull();
    });

    it('should show form when New User button is clicked', () => {
      const button = fixture.nativeElement.querySelector('[data-testid="new-user-button"]') as HTMLButtonElement;
      button.click();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('[data-testid="user-form"]')).toBeTruthy();
      expect(compiled.querySelector('[data-testid="first-name-input"]')).toBeTruthy();
      expect(compiled.querySelector('[data-testid="email-input"]')).toBeTruthy();
      expect(compiled.querySelector('[data-testid="role-select"]')).toBeTruthy();
    });

    it('should hide form when Cancel is clicked', () => {
      component.openForm();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[data-testid="user-form"]')).toBeTruthy();

      const cancelBtn = fixture.nativeElement.querySelector('[data-testid="cancel-button"]') as HTMLButtonElement;
      cancelBtn.click();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('[data-testid="user-form"]')).toBeNull();
    });

    it('should create user and add to list on submit', fakeAsync(() => {
      const newUser = { id: 'u3', email: 'new@cec.com', role: 'player' as const, firstName: 'New', lastName: 'User', categoryId: 'cat-1' };
      userService.createUser.mockReturnValue(of({ user: newUser }));

      component.openForm();
      component.formData = {
        email: 'new@cec.com',
        password: 'pass123',
        role: 'player',
        firstName: 'New',
        lastName: 'User',
        categoryId: 'cat-1',
      };
      component.onSubmit();
      tick();
      fixture.detectChanges();

      expect(component.users).toHaveLength(3);
      expect(component.showForm()).toBe(false);
    }));

    it('should show error on duplicate email (409)', fakeAsync(() => {
      const error = new HttpErrorResponse({
        status: 409,
        error: { error: 'Email already exists' },
      });
      userService.createUser.mockReturnValue(throwError(() => error));

      component.openForm();
      component.formData = {
        email: 'admin@cec.com',
        password: 'pass123',
        role: 'admin',
        firstName: 'Dup',
        lastName: 'User',
        categoryId: null,
      };
      component.onSubmit();
      tick();
      fixture.detectChanges();

      expect(component.formError()).toBe('Email already exists');
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('[data-testid="form-error"]')?.textContent).toContain('Email already exists');
    }));

    it('should show category dropdown only for player role', () => {
      component.openForm();
      component.formData.role = 'player';
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[data-testid="category-select"]')).toBeTruthy();

      component.formData.role = 'admin';
      component.onRoleChange();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[data-testid="category-select"]')).toBeNull();
    });

    it('should clear categoryId when switching to admin role', () => {
      component.openForm();
      component.formData.role = 'player';
      component.formData.categoryId = 'cat-1';
      component.formData.role = 'admin';
      component.onRoleChange();

      expect(component.formData.categoryId).toBeNull();
    });
  });

  describe('getCategoryName', () => {
    it('should return category name for valid id', () => {
      expect(component.getCategoryName('cat-1')).toBe('Mixto Sub 14 A');
    });

    it('should return dash for null categoryId', () => {
      expect(component.getCategoryName(null)).toBe('-');
    });

    it('should return raw id for unknown category', () => {
      expect(component.getCategoryName('unknown')).toBe('unknown');
    });
  });
});
