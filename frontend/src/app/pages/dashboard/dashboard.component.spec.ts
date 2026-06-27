import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { PlayerService } from '../../services/player.service';
import { AuthService } from '../../services/auth.service';
import { FeeService } from '../../services/fee.service';
import { provideTranslateTesting, setupTestTranslations } from '../../testing/translate-testing';
import { Category, Player } from '../../models/player.model';
import { CategoryFee, PlayerFee } from '../../models/fee.model';

const mockCategories: Category[] = [
  { id: 'cat-1', name: 'Sub 14' },
  { id: 'cat-2', name: 'Sub 16' },
  { id: 'cat-3', name: 'Sub 19' },
  { id: 'cat-4', name: 'Primera' },
  { id: 'cat-5', name: 'Intermedia' },
  { id: 'cat-6', name: 'Caballeros' },
];

const mockPlayersCat1: Player[] = [
  { id: 'p-01', number: 1, firstName: 'Mateo', lastName: 'Alvarez', status: 'active', categoryId: 'cat-1' },
  { id: 'p-02', number: 2, firstName: 'Valentina', lastName: 'Bravo', status: 'active', categoryId: 'cat-1' },
  { id: 'p-03', number: 3, firstName: 'Lucas', lastName: 'Castro', status: 'inactive', categoryId: 'cat-1' },
];

const mockPlayersCat2: Player[] = [
  { id: 'p-09', number: 1, firstName: 'Tomas', lastName: 'Ibanez', status: 'active', categoryId: 'cat-2' },
  { id: 'p-10', number: 2, firstName: 'Martina', lastName: 'Jimenez', status: 'inactive', categoryId: 'cat-2' },
];

const mockPlayersCat3: Player[] = [];
const mockPlayersCat4: Player[] = [
  { id: 'p-11', number: 1, firstName: 'Joaquin', lastName: 'Klein', status: 'active', categoryId: 'cat-4' },
];
const mockPlayersCat5: Player[] = [];
const mockPlayersCat6: Player[] = [];

const mockFees: CategoryFee[] = [
  {
    id: 'fee-1', categoryId: 'cat-1', categoryName: 'Sub 14',
    totalAmount: 3000, availablePlayers: 10, perPlayerAmount: 300,
    weekStartDate: '2026-06-15', createdBy: 'admin-1', createdAt: '2026-06-15T00:00:00Z',
    type: 'fee', playerFees: [], paidCount: 7, unpaidCount: 3,
  },
  {
    id: 'fee-2', categoryId: 'cat-2', categoryName: 'Sub 16',
    totalAmount: 4000, availablePlayers: 8, perPlayerAmount: 500,
    weekStartDate: '2026-06-15', createdBy: 'admin-1', createdAt: '2026-06-15T00:00:00Z',
    type: 'fee', playerFees: [], paidCount: 5, unpaidCount: 3,
  },
];

const mockPlayerFeePaid: PlayerFee = {
  id: 'pf-1', categoryFeeId: 'fee-1', userId: 'user-1',
  playerName: 'Mateo Alvarez', status: 'paid', paidAt: '2026-06-16T10:00:00Z',
};

const mockPlayerFeePending: PlayerFee = {
  id: 'pf-1', categoryFeeId: 'fee-1', userId: 'user-1',
  playerName: 'Mateo Alvarez', status: 'pending', paidAt: null,
};

const mockFeesWithPaidPlayer: CategoryFee[] = [{
  id: 'fee-1', categoryId: 'cat-1', categoryName: 'Sub 14',
  totalAmount: 3000, availablePlayers: 10, perPlayerAmount: 300,
  weekStartDate: '2026-06-15', createdBy: 'admin-1', createdAt: '2026-06-15T00:00:00Z',
  type: 'fee', playerFees: [mockPlayerFeePaid], paidCount: 1, unpaidCount: 0,
}];

const mockFeesWithPendingPlayer: CategoryFee[] = [{
  id: 'fee-1', categoryId: 'cat-1', categoryName: 'Sub 14',
  totalAmount: 3000, availablePlayers: 10, perPlayerAmount: 300,
  weekStartDate: '2026-06-15', createdBy: 'admin-1', createdAt: '2026-06-15T00:00:00Z',
  type: 'fee', playerFees: [mockPlayerFeePending], paidCount: 0, unpaidCount: 1,
}];

const mockTravelPaid: CategoryFee = {
  id: 'travel-1', categoryId: 'cat-1', categoryName: 'Sub 14',
  totalAmount: 1500, availablePlayers: 10, perPlayerAmount: 150,
  weekStartDate: '2026-06-15', createdBy: 'admin-1', createdAt: '2026-06-15T00:00:00Z',
  type: 'travel',
  playerFees: [{ id: 'tpf-1', categoryFeeId: 'travel-1', userId: 'user-1', playerName: 'Mateo Alvarez', status: 'paid', paidAt: '2026-06-16T11:00:00Z' }],
  paidCount: 1, unpaidCount: 0,
};

const mockTravelPending: CategoryFee = {
  ...mockTravelPaid,
  playerFees: [{ id: 'tpf-1', categoryFeeId: 'travel-1', userId: 'user-1', playerName: 'Mateo Alvarez', status: 'pending', paidAt: null }],
  paidCount: 0, unpaidCount: 1,
};

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let playerServiceMock: jest.Mocked<PlayerService>;
  let feeServiceMock: jest.Mocked<Partial<FeeService>>;

  function createTestBed(userRole = 'admin') {
    playerServiceMock = {
      getCategories: jest.fn().mockReturnValue(of(mockCategories)),
      getPlayersByCategory: jest.fn().mockImplementation((categoryId: string) => {
        const playersMap: Record<string, Player[]> = {
          'cat-1': mockPlayersCat1,
          'cat-2': mockPlayersCat2,
          'cat-3': mockPlayersCat3,
          'cat-4': mockPlayersCat4,
          'cat-5': mockPlayersCat5,
          'cat-6': mockPlayersCat6,
        };
        return of({
          data: playersMap[categoryId] ?? [],
          category: mockCategories.find((c) => c.id === categoryId) ?? null,
        });
      }),
    } as unknown as jest.Mocked<PlayerService>;

    feeServiceMock = {
      getCurrentFees: jest.fn().mockReturnValue(of(mockFees)),
    };

    const authServiceMock = {
      user: jest.fn().mockReturnValue({ id: 'user-1', role: userRole, categoryId: userRole === 'admin' ? null : 'cat-1' }),
      isAuthenticated: jest.fn().mockReturnValue(true),
      userName: jest.fn().mockReturnValue('Admin CEC'),
      getToken: jest.fn().mockReturnValue('token'),
    };

    return TestBed.configureTestingModule({
      imports: [DashboardComponent, RouterModule.forRoot([])],
      providers: [
        { provide: PlayerService, useValue: playerServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: FeeService, useValue: feeServiceMock },
        ...provideTranslateTesting(),
      ],
    }).compileComponents().then(() => {
      setupTestTranslations(TestBed.inject(TranslateService));
    });
  }

  beforeEach(async () => {
    await createTestBed('admin');

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('loading state', () => {
    it('should show loading initially', () => {
      expect(component.loading).toBe(true);
    });

    it('should hide loading after data is fetched', () => {
      fixture.detectChanges();
      expect(component.loading).toBe(false);
    });

    it('should render a loading indicator in the template', () => {
      const categoriesSubject = new Subject<Category[]>();
      playerServiceMock.getCategories.mockReturnValue(categoriesSubject.asObservable());
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const loadingEl = compiled.querySelector('[data-testid="loading-state"]');
      expect(loadingEl).toBeTruthy();

      categoriesSubject.next(mockCategories);
      categoriesSubject.complete();
    });

    it('should hide loading indicator after data loads', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const loadingEl = compiled.querySelector('[data-testid="loading-state"]');
      expect(loadingEl).toBeNull();
    });
  });

  describe('data loaded', () => {
    it('should fetch categories on init', () => {
      fixture.detectChanges();
      expect(playerServiceMock.getCategories).toHaveBeenCalled();
    });

    it('should fetch players for each category', () => {
      fixture.detectChanges();
      expect(playerServiceMock.getPlayersByCategory).toHaveBeenCalledWith('cat-1');
      expect(playerServiceMock.getPlayersByCategory).toHaveBeenCalledWith('cat-2');
      expect(playerServiceMock.getPlayersByCategory).toHaveBeenCalledWith('cat-3');
      expect(playerServiceMock.getPlayersByCategory).toHaveBeenCalledWith('cat-4');
      expect(playerServiceMock.getPlayersByCategory).toHaveBeenCalledWith('cat-5');
      expect(playerServiceMock.getPlayersByCategory).toHaveBeenCalledWith('cat-6');
    });

    it('should create chart data for each category', () => {
      fixture.detectChanges();
      expect(component.categoryCharts.length).toBe(6);
    });

    it('should compute correct active/inactive counts for cat-1', () => {
      fixture.detectChanges();
      const chart = component.categoryCharts.find((c) => c.categoryName === 'Sub 14');
      expect(chart).toBeTruthy();
      expect(chart!.activeCount).toBe(2);
      expect(chart!.inactiveCount).toBe(1);
    });

    it('should compute correct active/inactive counts for cat-2', () => {
      fixture.detectChanges();
      const chart = component.categoryCharts.find((c) => c.categoryName === 'Sub 16');
      expect(chart).toBeTruthy();
      expect(chart!.activeCount).toBe(1);
      expect(chart!.inactiveCount).toBe(1);
    });

    it('should mark category with no players as empty', () => {
      fixture.detectChanges();
      const chart = component.categoryCharts.find((c) => c.categoryName === 'Sub 19');
      expect(chart).toBeTruthy();
      expect(chart!.isEmpty).toBe(true);
      expect(chart!.activeCount).toBe(0);
      expect(chart!.inactiveCount).toBe(0);
    });

    it('should render one chart card per category', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const cards = compiled.querySelectorAll('[data-testid="chart-card"]');
      expect(cards.length).toBe(6);
    });

    it('should display category name as chart title', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const titles = compiled.querySelectorAll('[data-testid="chart-title"]');
      expect(titles.length).toBe(6);
      expect(titles[0].textContent?.trim()).toBe('Sub 14');
      expect(titles[1].textContent?.trim()).toBe('Sub 16');
      expect(titles[2].textContent?.trim()).toBe('Sub 19');
      expect(titles[3].textContent?.trim()).toBe('Primera');
      expect(titles[4].textContent?.trim()).toBe('Intermedia');
      expect(titles[5].textContent?.trim()).toBe('Caballeros');
    });

    it('should show a canvas for categories with players', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const canvases = compiled.querySelectorAll('canvas[data-chart-index]');
      expect(canvases.length).toBe(3);
    });

    it('should show empty state text for category with no players', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const emptyStates = compiled.querySelectorAll('[data-testid="chart-empty"]');
      expect(emptyStates.length).toBe(3);
      expect(emptyStates[0].textContent?.trim()).toBe('No players');
    });

    it('should display active and inactive counts as legend', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const legends = compiled.querySelectorAll('[data-testid="chart-legend"]');
      expect(legends.length).toBe(3);

      const firstLegend = legends[0];
      expect(firstLegend.textContent).toContain('Active: 2');
      expect(firstLegend.textContent).toContain('Inactive: 1');
    });
  });

  describe('error state', () => {
    it('should show error when categories fail to load', () => {
      playerServiceMock.getCategories.mockReturnValue(
        throwError(() => new Error('Network error'))
      );
      fixture.detectChanges();

      expect(component.error).toBeTruthy();
      const compiled = fixture.nativeElement as HTMLElement;
      const errorEl = compiled.querySelector('[data-testid="error-state"]');
      expect(errorEl).toBeTruthy();
    });

    it('should show error when fetching players fails', () => {
      playerServiceMock.getPlayersByCategory.mockReturnValue(
        throwError(() => new Error('Failed to fetch'))
      );
      fixture.detectChanges();

      expect(component.error).toBeTruthy();
    });

    it('should not show charts when error occurs', () => {
      playerServiceMock.getCategories.mockReturnValue(
        throwError(() => new Error('Network error'))
      );
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const cards = compiled.querySelectorAll('[data-testid="chart-card"]');
      expect(cards.length).toBe(0);
    });

    it('should display user-friendly error message', () => {
      playerServiceMock.getCategories.mockReturnValue(
        throwError(() => new Error('Network error'))
      );
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const errorEl = compiled.querySelector('[data-testid="error-state"]');
      expect(errorEl?.textContent).toContain('Unable to load signing data');
    });
  });

  describe('edge cases', () => {
    it('should use "Unknown" when category is null in response', () => {
      playerServiceMock.getPlayersByCategory.mockReturnValue(
        of({ data: mockPlayersCat1, category: null })
      );
      fixture.detectChanges();

      const chart = component.categoryCharts.find((c) => c.categoryName === 'Unknown');
      expect(chart).toBeTruthy();
      expect(chart!.activeCount).toBe(2);
    });
  });

  describe('empty categories', () => {
    it('should handle when no categories exist', () => {
      playerServiceMock.getCategories.mockReturnValue(of([]));
      fixture.detectChanges();

      expect(component.loading).toBe(false);
      expect(component.categoryCharts.length).toBe(0);
    });
  });

  describe('admin fee charts', () => {
    it('should load fee data for admin', () => {
      fixture.detectChanges();
      expect(feeServiceMock.getCurrentFees).toHaveBeenCalled();
    });

    it('should create fee chart data for each category with fees', () => {
      fixture.detectChanges();
      expect(component.feeCharts.length).toBe(2);
    });

    it('should compute correct paid/unpaid counts', () => {
      fixture.detectChanges();
      const chart = component.feeCharts.find((c) => c.categoryName === 'Sub 14');
      expect(chart).toBeTruthy();
      expect(chart!.paidCount).toBe(7);
      expect(chart!.unpaidCount).toBe(3);
    });

    it('should render fee chart cards in template', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const feeCards = compiled.querySelectorAll('[data-testid="fee-chart-card"]');
      expect(feeCards.length).toBe(2);
    });

    it('should display paid/unpaid legend', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const legends = compiled.querySelectorAll('[data-testid="fee-chart-legend"]');
      expect(legends.length).toBe(2);
      expect(legends[0].textContent).toContain('Paid: 7');
      expect(legends[0].textContent).toContain('Unpaid: 3');
    });

    it('should show section title for fee charts', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const title = compiled.querySelector('[data-testid="fee-charts-title"]');
      expect(title).toBeTruthy();
      expect(title?.textContent).toContain('Fee Collection');
    });

    it('should handle empty fees gracefully', () => {
      feeServiceMock.getCurrentFees!.mockReturnValue(of([]));
      fixture.detectChanges();
      expect(component.feeCharts.length).toBe(0);
    });
  });

  describe('non-admin fee charts', () => {
    it('should load fee data for player role (used for play status)', async () => {
      TestBed.resetTestingModule();
      await createTestBed('player');
      fixture = TestBed.createComponent(DashboardComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(feeServiceMock.getCurrentFees).toHaveBeenCalled();
    });

    it('should not show fee chart cards for player role', async () => {
      TestBed.resetTestingModule();
      await createTestBed('player');
      fixture = TestBed.createComponent(DashboardComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelectorAll('[data-testid="fee-chart-card"]').length).toBe(0);
    });
  });

  describe('play eligibility status card', () => {
    it('should show enabled status when player fee is paid', async () => {
      TestBed.resetTestingModule();
      await createTestBed('player');
      feeServiceMock.getCurrentFees!.mockReturnValue(of(mockFeesWithPaidPlayer));
      fixture = TestBed.createComponent(DashboardComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.playStatus).toBe('enabled');
      const compiled = fixture.nativeElement as HTMLElement;
      const card = compiled.querySelector('[data-testid="play-status-enabled"]');
      expect(card).toBeTruthy();
      expect(card?.textContent).toContain("You're enabled to play this weekend");
    });

    it('should show not-enabled status when player fee is pending', async () => {
      TestBed.resetTestingModule();
      await createTestBed('player');
      feeServiceMock.getCurrentFees!.mockReturnValue(of(mockFeesWithPendingPlayer));
      fixture = TestBed.createComponent(DashboardComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.playStatus).toBe('not-enabled');
      const compiled = fixture.nativeElement as HTMLElement;
      const card = compiled.querySelector('[data-testid="play-status-not-enabled"]');
      expect(card).toBeTruthy();
      expect(card?.textContent).toContain("you're not enabled to play this weekend");
    });

    it('should show link to fees page when fee is pending', async () => {
      TestBed.resetTestingModule();
      await createTestBed('player');
      feeServiceMock.getCurrentFees!.mockReturnValue(of(mockFeesWithPendingPlayer));
      fixture = TestBed.createComponent(DashboardComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const link = compiled.querySelector('[data-testid="play-status-not-enabled"] a');
      expect(link).toBeTruthy();
      expect(link?.textContent).toContain('Go to My Fees to pay and play this weekend');
      expect(link?.getAttribute('href')).toBe('/fees');
    });

    it('should show no-fee status when no fee configured for the week', async () => {
      TestBed.resetTestingModule();
      await createTestBed('player');
      feeServiceMock.getCurrentFees!.mockReturnValue(of([]));
      fixture = TestBed.createComponent(DashboardComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.playStatus).toBe('no-fee');
      const compiled = fixture.nativeElement as HTMLElement;
      const card = compiled.querySelector('[data-testid="play-status-no-fee"]');
      expect(card).toBeTruthy();
      expect(card?.textContent).toContain('No fee configured for this week yet');
    });

    it('should show enabled status for captain with paid fee', async () => {
      TestBed.resetTestingModule();
      await createTestBed('captain');
      feeServiceMock.getCurrentFees!.mockReturnValue(of(mockFeesWithPaidPlayer));
      fixture = TestBed.createComponent(DashboardComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.playStatus).toBe('enabled');
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('[data-testid="play-status-enabled"]')).toBeTruthy();
    });

    it('should not show play status card for admin', () => {
      fixture.detectChanges();

      expect(component.playStatus).toBeNull();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('[data-testid="play-status-card"]')).toBeNull();
    });

    it('should handle no-fee when user not found in playerFees', async () => {
      const feesWithOtherPlayer: CategoryFee[] = [{
        ...mockFeesWithPaidPlayer[0],
        playerFees: [{ ...mockPlayerFeePaid, userId: 'other-user' }],
      }];
      TestBed.resetTestingModule();
      await createTestBed('player');
      feeServiceMock.getCurrentFees!.mockReturnValue(of(feesWithOtherPlayer));
      fixture = TestBed.createComponent(DashboardComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.playStatus).toBe('no-fee');
    });

    it('should not break dashboard when fee service fails for player', async () => {
      TestBed.resetTestingModule();
      await createTestBed('player');
      feeServiceMock.getCurrentFees!.mockReturnValue(throwError(() => new Error('Fee error')));
      fixture = TestBed.createComponent(DashboardComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.playStatus).toBeNull();
      expect(component.error).toBeNull();
    });
  });

  describe('travel fee eligibility', () => {
    it('should show enabled when fee is paid and no travel exists', async () => {
      TestBed.resetTestingModule();
      await createTestBed('player');
      feeServiceMock.getCurrentFees!.mockReturnValue(of(mockFeesWithPaidPlayer));
      fixture = TestBed.createComponent(DashboardComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.playStatus).toBe('enabled');
      expect(component.feeStatus).toBe('paid');
      expect(component.travelStatus).toBeNull();
    });

    it('should show enabled when both fee and travel are paid', async () => {
      TestBed.resetTestingModule();
      await createTestBed('player');
      feeServiceMock.getCurrentFees!.mockReturnValue(of([...mockFeesWithPaidPlayer, mockTravelPaid]));
      fixture = TestBed.createComponent(DashboardComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.playStatus).toBe('enabled');
      expect(component.feeStatus).toBe('paid');
      expect(component.travelStatus).toBe('paid');
    });

    it('should show not-enabled when fee is paid but travel is pending', async () => {
      TestBed.resetTestingModule();
      await createTestBed('player');
      feeServiceMock.getCurrentFees!.mockReturnValue(of([...mockFeesWithPaidPlayer, mockTravelPending]));
      fixture = TestBed.createComponent(DashboardComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.playStatus).toBe('not-enabled');
      expect(component.feeStatus).toBe('paid');
      expect(component.travelStatus).toBe('pending');
    });

    it('should show not-enabled when fee is pending and travel is paid', async () => {
      TestBed.resetTestingModule();
      await createTestBed('player');
      feeServiceMock.getCurrentFees!.mockReturnValue(of([...mockFeesWithPendingPlayer, mockTravelPaid]));
      fixture = TestBed.createComponent(DashboardComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.playStatus).toBe('not-enabled');
      expect(component.feeStatus).toBe('pending');
      expect(component.travelStatus).toBe('paid');
    });

    it('should show not-enabled when both fee and travel are pending', async () => {
      TestBed.resetTestingModule();
      await createTestBed('player');
      feeServiceMock.getCurrentFees!.mockReturnValue(of([...mockFeesWithPendingPlayer, mockTravelPending]));
      fixture = TestBed.createComponent(DashboardComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.playStatus).toBe('not-enabled');
      expect(component.feeStatus).toBe('pending');
      expect(component.travelStatus).toBe('pending');
    });
  });

  describe('status pills', () => {
    it('should show fee pill when player has fee status', async () => {
      TestBed.resetTestingModule();
      await createTestBed('player');
      feeServiceMock.getCurrentFees!.mockReturnValue(of(mockFeesWithPaidPlayer));
      fixture = TestBed.createComponent(DashboardComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const feePill = compiled.querySelector('[data-testid="fee-pill"]');
      expect(feePill).toBeTruthy();
      expect(feePill?.textContent?.trim()).toBe('Fee: Paid');
    });

    it('should show pending fee pill', async () => {
      TestBed.resetTestingModule();
      await createTestBed('player');
      feeServiceMock.getCurrentFees!.mockReturnValue(of(mockFeesWithPendingPlayer));
      fixture = TestBed.createComponent(DashboardComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const feePill = compiled.querySelector('[data-testid="fee-pill"]');
      expect(feePill).toBeTruthy();
      expect(feePill?.textContent?.trim()).toBe('Fee: Pending');
    });

    it('should show travel pill when travel fee exists', async () => {
      TestBed.resetTestingModule();
      await createTestBed('player');
      feeServiceMock.getCurrentFees!.mockReturnValue(of([...mockFeesWithPaidPlayer, mockTravelPaid]));
      fixture = TestBed.createComponent(DashboardComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const travelPill = compiled.querySelector('[data-testid="travel-pill"]');
      expect(travelPill).toBeTruthy();
      expect(travelPill?.textContent?.trim()).toBe('Travel: Paid');
    });

    it('should show pending travel pill', async () => {
      TestBed.resetTestingModule();
      await createTestBed('player');
      feeServiceMock.getCurrentFees!.mockReturnValue(of([...mockFeesWithPaidPlayer, mockTravelPending]));
      fixture = TestBed.createComponent(DashboardComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const travelPill = compiled.querySelector('[data-testid="travel-pill"]');
      expect(travelPill).toBeTruthy();
      expect(travelPill?.textContent?.trim()).toBe('Travel: Pending');
    });

    it('should not show travel pill when no travel fee exists', async () => {
      TestBed.resetTestingModule();
      await createTestBed('player');
      feeServiceMock.getCurrentFees!.mockReturnValue(of(mockFeesWithPaidPlayer));
      fixture = TestBed.createComponent(DashboardComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('[data-testid="travel-pill"]')).toBeNull();
    });

    it('should not show pills for admin', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('[data-testid="status-pills"]')).toBeNull();
    });
  });
});
