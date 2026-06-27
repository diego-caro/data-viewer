import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';
import { PlayersComponent } from './players.component';
import { PlayerService } from '../../services/player.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { provideTranslateTesting, setupTestTranslations } from '../../testing/translate-testing';
import { Category, Player, PlayersResponse } from '../../models/player.model';

const mockCategories: Category[] = [
  { id: 'cat-1', name: 'Sub 14' },
  { id: 'cat-2', name: 'Sub 16' },
];

const mockPlayers: Player[] = [
  { id: 'p-01', number: 1, firstName: 'Mateo', lastName: 'Alvarez', status: 'active', categoryId: 'cat-1', role: 'player' },
  { id: 'p-02', number: 3, firstName: 'Lucas', lastName: 'Castro', status: 'inactive', categoryId: 'cat-1', role: 'player' },
  { id: 'p-03', number: 2, firstName: 'Valentina', lastName: 'Bravo', status: 'active', categoryId: 'cat-1', role: 'captain' },
];

describe('PlayersComponent', () => {
  let component: PlayersComponent;
  let fixture: ComponentFixture<PlayersComponent>;
  let playerServiceMock: jest.Mocked<PlayerService>;
  let userServiceMock: jest.Mocked<Partial<UserService>>;

  function setup(userRole: 'admin' | 'player' | 'captain' = 'admin') {
    playerServiceMock = {
      getCategories: jest.fn().mockReturnValue(of(mockCategories)),
      getPlayersByCategory: jest.fn().mockReturnValue(of({ data: mockPlayers, category: mockCategories[0] })),
    } as unknown as jest.Mocked<PlayerService>;

    userServiceMock = {
      updatePlayerNumber: jest.fn().mockReturnValue(of({ user: {} })),
      changeCaptain: jest.fn().mockReturnValue(of({
        newCaptain: { id: 'p-01', role: 'captain' },
        oldCaptain: { id: 'p-03', role: 'player' },
      })),
    };

    const authServiceMock = {
      user: jest.fn().mockReturnValue({ id: 'u1', role: userRole, categoryId: userRole === 'player' ? 'cat-1' : null }),
      isAuthenticated: jest.fn().mockReturnValue(true),
      userName: jest.fn().mockReturnValue('Test User'),
      getToken: jest.fn().mockReturnValue('token'),
    };

    return TestBed.configureTestingModule({
      imports: [PlayersComponent],
      providers: [
        { provide: PlayerService, useValue: playerServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        ...provideTranslateTesting(),
      ],
    }).compileComponents().then(() => {
      setupTestTranslations(TestBed.inject(TranslateService));
    });
  }

  describe('basic functionality', () => {
    beforeEach(async () => {
      await setup('admin');
      fixture = TestBed.createComponent(PlayersComponent);
      component = fixture.componentInstance;
    });

    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should show loading indicator initially', () => {
      expect(component.loading).toBe(true);
    });

    it('should hide loading after data is fetched', () => {
      fixture.detectChanges();
      expect(component.loading).toBe(false);
    });

    it('should load categories on init', () => {
      fixture.detectChanges();
      expect(playerServiceMock.getCategories).toHaveBeenCalled();
      expect(component.categories).toEqual(mockCategories);
    });

    it('should select the first category by default', () => {
      fixture.detectChanges();
      expect(component.selectedCategoryId).toBe('cat-1');
    });

    it('should load players when category changes', () => {
      fixture.detectChanges();
      playerServiceMock.getPlayersByCategory.mockClear();

      const newPlayers: Player[] = [
        { id: 'p-09', number: 1, firstName: 'Tomas', lastName: 'Ibanez', status: 'active', categoryId: 'cat-2', role: 'player' },
      ];
      playerServiceMock.getPlayersByCategory.mockReturnValue(
        of({ data: newPlayers, category: mockCategories[1] })
      );

      component.onCategoryChange('cat-2');

      expect(component.selectedCategoryId).toBe('cat-2');
      expect(component.players).toEqual(newPlayers);
      expect(playerServiceMock.getPlayersByCategory).toHaveBeenCalledWith('cat-2');
    });

    it('should display players after loading', () => {
      fixture.detectChanges();
      expect(component.players).toEqual(mockPlayers);
    });

    it('should render player rows in the template', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const playerRows = compiled.querySelectorAll('[data-testid="player-row"]');
      expect(playerRows.length).toBe(mockPlayers.length);
    });

    it('should show player last name and first name', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const firstRow = compiled.querySelector('[data-testid="player-row"]');
      expect(firstRow?.textContent).toContain('Alvarez');
      expect(firstRow?.textContent).toContain('Mateo');
    });

    it('should show green badge for active players', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const activeBadges = compiled.querySelectorAll('[data-testid="badge-active"]');
      expect(activeBadges.length).toBe(2);
    });

    it('should show red badge for inactive players', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const inactiveBadges = compiled.querySelectorAll('[data-testid="badge-inactive"]');
      expect(inactiveBadges.length).toBe(1);
    });
  });

  describe('captain badge', () => {
    beforeEach(async () => {
      await setup('admin');
      fixture = TestBed.createComponent(PlayersComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should show captain badge for captain player', () => {
      const el = fixture.nativeElement as HTMLElement;
      const captainBadges = el.querySelectorAll('[data-testid="captain-badge"]');
      expect(captainBadges.length).toBe(1);
    });

    it('should not show captain badge for regular players', () => {
      const el = fixture.nativeElement as HTMLElement;
      const rows = el.querySelectorAll('[data-testid="player-row"]');
      expect(rows[0].querySelector('[data-testid="captain-badge"]')).toBeNull();
      expect(rows[1].querySelector('[data-testid="captain-badge"]')).toBeNull();
    });

    it('should show C label in captain badge', () => {
      const el = fixture.nativeElement as HTMLElement;
      const badge = el.querySelector('[data-testid="captain-badge"]');
      expect(badge?.textContent?.trim()).toBe('C');
    });
  });

  describe('jersey number display', () => {
    beforeEach(async () => {
      await setup('admin');
      fixture = TestBed.createComponent(PlayersComponent);
      component = fixture.componentInstance;
    });

    it('should display jersey number in badge', () => {
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const badges = el.querySelectorAll('[data-testid="badge-active"]');
      expect(badges[0]?.textContent?.trim()).toBe('1');
    });

    it('should display dash when jersey number is null', () => {
      const playersWithNull: Player[] = [
        { id: 'p-01', number: null, firstName: 'No', lastName: 'Number', status: 'active', categoryId: 'cat-1', role: 'player' },
      ];
      playerServiceMock.getPlayersByCategory.mockReturnValue(of({ data: playersWithNull, category: mockCategories[0] }));
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const badge = el.querySelector('[data-testid="badge-active"]');
      expect(badge?.textContent?.trim()).toBe('-');
    });
  });

  describe('admin: edit jersey number', () => {
    beforeEach(async () => {
      await setup('admin');
      fixture = TestBed.createComponent(PlayersComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should show edit button for admin', () => {
      const el = fixture.nativeElement as HTMLElement;
      const editButtons = el.querySelectorAll('[data-testid="edit-number-button"]');
      expect(editButtons.length).toBe(3);
    });

    it('should show edit form when edit button is clicked', () => {
      component.startEditNumber(mockPlayers[0]);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid="edit-number-form"]')).toBeTruthy();
      expect(el.querySelector('[data-testid="number-input"]')).toBeTruthy();
    });

    it('should hide edit form when cancel is clicked', () => {
      component.startEditNumber(mockPlayers[0]);
      fixture.detectChanges();

      component.cancelEditNumber();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid="edit-number-form"]')).toBeNull();
    });

    it('should call updatePlayerNumber on save', fakeAsync(() => {
      component.startEditNumber(mockPlayers[0]);
      component.editingNumber.set(10);
      component.saveNumber(mockPlayers[0]);
      tick();

      expect(userServiceMock.updatePlayerNumber).toHaveBeenCalledWith('p-01', 10);
      expect(component.editingPlayerId()).toBeNull();
    }));
  });

  describe('admin: change captain', () => {
    beforeEach(async () => {
      await setup('admin');
      fixture = TestBed.createComponent(PlayersComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should show Make Captain button for non-captain players', () => {
      const el = fixture.nativeElement as HTMLElement;
      const buttons = el.querySelectorAll('[data-testid="make-captain-button"]');
      expect(buttons.length).toBe(2);
    });

    it('should not show Make Captain button for captain', () => {
      const el = fixture.nativeElement as HTMLElement;
      const captainRow = el.querySelectorAll('[data-testid="player-row"]')[2];
      expect(captainRow.querySelector('[data-testid="make-captain-button"]')).toBeNull();
    });

    it('should call changeCaptain and update roles', fakeAsync(() => {
      component.onChangeCaptain(mockPlayers[0]);
      tick();

      expect(userServiceMock.changeCaptain).toHaveBeenCalledWith('cat-1', 'p-01');
      const newCaptain = component.players.find((p) => p.id === 'p-01');
      const oldCaptain = component.players.find((p) => p.id === 'p-03');
      expect(newCaptain?.role).toBe('captain');
      expect(oldCaptain?.role).toBe('player');
    }));
  });

  describe('non-admin: no admin controls', () => {
    beforeEach(async () => {
      await setup('player');
      fixture = TestBed.createComponent(PlayersComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should not show edit buttons for player role', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid="edit-number-button"]')).toBeNull();
    });

    it('should not show Make Captain button for player role', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid="make-captain-button"]')).toBeNull();
    });
  });

  describe('SCRUM-7: dropdown selection bug', () => {
    beforeEach(async () => {
      await setup('admin');
      fixture = TestBed.createComponent(PlayersComponent);
      component = fixture.componentInstance;
    });

    it('should keep dropdown visible while players are loading', () => {
      fixture.detectChanges();

      const subject = new Subject<PlayersResponse>();
      playerServiceMock.getPlayersByCategory.mockReturnValue(subject.asObservable());

      component.onCategoryChange('cat-2');
      fixture.detectChanges();

      const select = fixture.nativeElement.querySelector('[data-testid="category-select"]');
      expect(select).toBeTruthy();

      subject.next({ data: [], category: mockCategories[1] });
      subject.complete();
    });

    it('should not show any loading spinner on category change', () => {
      fixture.detectChanges();

      const subject = new Subject<PlayersResponse>();
      playerServiceMock.getPlayersByCategory.mockReturnValue(subject.asObservable());

      component.onCategoryChange('cat-2');
      fixture.detectChanges();

      const spinner = fixture.nativeElement.querySelector('.animate-spin');
      expect(spinner).toBeNull();

      subject.next({ data: [], category: mockCategories[1] });
      subject.complete();
    });

    it('should reflect selected category in the dropdown DOM after async response', () => {
      fixture.detectChanges();

      const newPlayers: Player[] = [
        { id: 'p-09', number: 1, firstName: 'Tomas', lastName: 'Ibanez', status: 'active', categoryId: 'cat-2', role: 'player' },
      ];
      const subject = new Subject<PlayersResponse>();
      playerServiceMock.getPlayersByCategory.mockReturnValue(subject.asObservable());

      component.onCategoryChange('cat-2');
      subject.next({ data: newPlayers, category: mockCategories[1] });
      subject.complete();
      fixture.detectChanges();

      const select: HTMLSelectElement = fixture.nativeElement.querySelector('[data-testid="category-select"]');
      expect(select.value).toBe('cat-2');
    });

    it('should reflect the correct value after multiple category switches', () => {
      fixture.detectChanges();

      playerServiceMock.getPlayersByCategory.mockReturnValue(
        of({ data: [{ id: 'p-09', number: 1, firstName: 'Tomas', lastName: 'Ibanez', status: 'active' as const, categoryId: 'cat-2', role: 'player' as const }], category: mockCategories[1] })
      );
      component.onCategoryChange('cat-2');
      fixture.detectChanges();

      playerServiceMock.getPlayersByCategory.mockReturnValue(
        of({ data: mockPlayers, category: mockCategories[0] })
      );
      component.onCategoryChange('cat-1');
      fixture.detectChanges();

      const select: HTMLSelectElement = fixture.nativeElement.querySelector('[data-testid="category-select"]');
      expect(select.value).toBe('cat-1');
      expect(component.selectedCategoryId).toBe('cat-1');
    });

    it('should show first category selected in the dropdown DOM on initial load', () => {
      fixture.detectChanges();

      const select: HTMLSelectElement = fixture.nativeElement.querySelector('[data-testid="category-select"]');
      expect(select).toBeTruthy();
      expect(select.value).toBe('cat-1');
    });
  });

  describe('empty state', () => {
    beforeEach(async () => {
      await setup('admin');
      fixture = TestBed.createComponent(PlayersComponent);
      component = fixture.componentInstance;
    });

    it('should show empty message when no players in category', () => {
      playerServiceMock.getPlayersByCategory.mockReturnValue(
        of({ data: [], category: mockCategories[0] })
      );
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const emptyMessage = compiled.querySelector('[data-testid="empty-state"]');
      expect(emptyMessage).toBeTruthy();
    });
  });

  describe('empty categories', () => {
    beforeEach(async () => {
      await setup('admin');
      fixture = TestBed.createComponent(PlayersComponent);
      component = fixture.componentInstance;
    });

    it('should stop loading when no categories exist', () => {
      playerServiceMock.getCategories.mockReturnValue(of([]));
      fixture.detectChanges();

      expect(component.loading).toBe(false);
      expect(component.categories).toEqual([]);
      expect(component.players).toEqual([]);
    });
  });

  describe('error state', () => {
    beforeEach(async () => {
      await setup('admin');
      fixture = TestBed.createComponent(PlayersComponent);
      component = fixture.componentInstance;
    });

    it('should show error message when categories fail to load', () => {
      playerServiceMock.getCategories.mockReturnValue(
        throwError(() => new Error('Network error'))
      );

      fixture.detectChanges();

      expect(component.error).toBeTruthy();
      const compiled = fixture.nativeElement as HTMLElement;
      const errorMessage = compiled.querySelector('[data-testid="error-state"]');
      expect(errorMessage).toBeTruthy();
    });

    it('should show error message when players fail to load', () => {
      playerServiceMock.getPlayersByCategory.mockReturnValue(
        throwError(() => new Error('Network error'))
      );

      fixture.detectChanges();

      expect(component.error).toBeTruthy();
    });

    it('should show error when onCategoryChange fails', () => {
      fixture.detectChanges();

      playerServiceMock.getPlayersByCategory.mockReturnValue(
        throwError(() => new Error('Category load error'))
      );

      component.onCategoryChange('cat-2');

      expect(component.error).toBe('Failed to load players');
      expect(component.loading).toBe(false);
    });

    it('should use fallback error message when error has no message on init', () => {
      playerServiceMock.getCategories.mockReturnValue(
        throwError(() => ({ message: '' }))
      );

      fixture.detectChanges();

      expect(component.error).toBe('Failed to load data');
    });

    it('should use fallback error message when error has no message on category change', () => {
      fixture.detectChanges();

      playerServiceMock.getPlayersByCategory.mockReturnValue(
        throwError(() => ({ message: '' }))
      );

      component.onCategoryChange('cat-2');

      expect(component.error).toBe('Failed to load players');
    });
  });
});
