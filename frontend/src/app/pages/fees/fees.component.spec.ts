import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';
import { PlayerFeesComponent } from './fees.component';
import { FeeService } from '../../services/fee.service';
import { AuthService } from '../../services/auth.service';
import { FixtureService } from '../../services/fixture.service';
import { provideTranslateTesting, setupTestTranslations } from '../../testing/translate-testing';
import { CategoryFee } from '../../models/fee.model';
import { FixtureMatch, FixtureDivision } from '../../models/fixture.model';

const mockFeeWithPending: CategoryFee = {
  id: 'fee-1', categoryId: 'cat-1', categoryName: 'Sub 14',
  totalAmount: 3000, availablePlayers: 10, perPlayerAmount: 300,
  periodStartDate: '2026-06-15', createdBy: 'admin-1',
  createdAt: '2026-06-15T00:00:00Z', type: 'match',
  playerFees: [
    { id: 'pf-1', feeId: 'fee-1', userId: 'player-1', playerName: 'One, Player', status: 'pending', paidAt: null },
    { id: 'pf-2', feeId: 'fee-1', userId: 'player-2', playerName: 'Two, Player', status: 'paid', paidAt: '2026-06-16T10:00:00Z' },
  ],
  paidCount: 1, unpaidCount: 1,
};

const mockFeeAllPaid: CategoryFee = {
  ...mockFeeWithPending,
  playerFees: [
    { id: 'pf-1', feeId: 'fee-1', userId: 'player-1', playerName: 'One, Player', status: 'paid', paidAt: '2026-06-16T10:00:00Z' },
  ],
  paidCount: 1, unpaidCount: 0,
};

const mockTravelPending: CategoryFee = {
  id: 'travel-1', categoryId: 'cat-1', categoryName: 'Sub 14',
  totalAmount: 1500, availablePlayers: 10, perPlayerAmount: 150,
  periodStartDate: '2026-06-15', createdBy: 'admin-1',
  createdAt: '2026-06-15T00:00:00Z', type: 'travel',
  playerFees: [
    { id: 'tpf-1', feeId: 'travel-1', userId: 'player-1', playerName: 'One, Player', status: 'pending', paidAt: null },
  ],
  paidCount: 0, unpaidCount: 1,
};

const mockTravelPaid: CategoryFee = {
  ...mockTravelPending,
  playerFees: [
    { id: 'tpf-1', feeId: 'travel-1', userId: 'player-1', playerName: 'One, Player', status: 'paid', paidAt: '2026-06-16T11:00:00Z' },
  ],
  paidCount: 1, unpaidCount: 0,
};

describe('PlayerFeesComponent', () => {
  let component: PlayerFeesComponent;
  let fixture: ComponentFixture<PlayerFeesComponent>;
  let feeServiceMock: jest.Mocked<Partial<FeeService>>;
  let authServiceMock: Partial<AuthService>;
  let fixtureServiceMock: jest.Mocked<Partial<FixtureService>>;

  const MOCK_DIVISIONS: FixtureDivision[] = [
    { id: 206752, name: 'Mixto Sub 14 A' },
    { id: 206754, name: 'Caballeros Primera' },
  ];

  function setupMocks(overrides?: {
    fees?: CategoryFee[];
    user?: { id: string; role: string; categoryId: string | null };
    matches?: FixtureMatch[];
    divisions?: FixtureDivision[];
  }) {
    const fees = overrides?.fees ?? [mockFeeWithPending];
    const user = overrides?.user ?? { id: 'player-1', role: 'player', categoryId: 'cat-1' };
    const matches = overrides?.matches ?? [];
    const divisions = overrides?.divisions ?? MOCK_DIVISIONS;

    feeServiceMock = {
      getCurrentFees: jest.fn().mockReturnValue(of(fees)),
      payFee: jest.fn().mockReturnValue(of({
        preferenceId: 'pref-123',
        initPoint: 'https://www.mercadopago.com/checkout/v1/redirect?pref_id=pref-123',
        sandboxInitPoint: 'https://sandbox.mercadopago.com/checkout',
      })),
      payAll: jest.fn().mockReturnValue(of({
        preferenceId: 'pref-all',
        initPoint: 'https://www.mercadopago.com/checkout/v1/redirect?pref_id=pref-all',
        sandboxInitPoint: 'https://sandbox.mercadopago.com/checkout',
      })),
      verifyPayment: jest.fn().mockReturnValue(of({ status: 'paid' })),
    };

    authServiceMock = {
      user: jest.fn().mockReturnValue(user) as unknown as AuthService['user'],
    };

    fixtureServiceMock = {
      getDivisions: jest.fn().mockReturnValue(of(divisions)),
      getMatches: jest.fn().mockReturnValue(of(matches)),
    };
  }

  async function createComponent(queryParams: Record<string, string> = {}) {
    await TestBed.configureTestingModule({
      imports: [PlayerFeesComponent],
      providers: [
        { provide: FeeService, useValue: feeServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: FixtureService, useValue: fixtureServiceMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } },
        },
        ...provideTranslateTesting(),
      ],
    }).compileComponents();

    setupTestTranslations(TestBed.inject(TranslateService));
    fixture = TestBed.createComponent(PlayerFeesComponent);
    component = fixture.componentInstance;
  }

  describe('loading state', () => {
    beforeEach(async () => {
      setupMocks();
      await createComponent();
    });

    it('should show loading initially', () => {
      expect(component.loading).toBe(true);
    });

    it('should render loading indicator in template', () => {
      const feesSubject = new Subject<CategoryFee[]>();
      feeServiceMock.getCurrentFees!.mockReturnValue(feesSubject.asObservable());
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid="loading-state"]')).toBeTruthy();

      feesSubject.next([mockFeeWithPending]);
      feesSubject.complete();
    });

    it('should hide loading after data loads', () => {
      fixture.detectChanges();
      expect(component.loading).toBe(false);
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid="loading-state"]')).toBeNull();
    });
  });

  describe('data loaded — player has pending fee', () => {
    beforeEach(async () => {
      setupMocks();
      await createComponent();
      fixture.detectChanges();
    });

    it('should display fee amount', () => {
      const el = fixture.nativeElement as HTMLElement;
      const amount = el.querySelector('[data-testid="fee-amount"]');
      expect(amount?.textContent).toContain('300');
    });

    it('should display category name', () => {
      const el = fixture.nativeElement as HTMLElement;
      const name = el.querySelector('[data-testid="fee-category"]');
      expect(name?.textContent).toContain('Sub 14');
    });

    it('should show Pay button for pending fee', () => {
      const el = fixture.nativeElement as HTMLElement;
      const payBtn = el.querySelector('[data-testid="pay-fee-button"]');
      expect(payBtn).toBeTruthy();
    });

    it('should not show paid badge', () => {
      const el = fixture.nativeElement as HTMLElement;
      const paidBadge = el.querySelector('[data-testid="paid-badge"]');
      expect(paidBadge).toBeNull();
    });
  });

  describe('data loaded — player has paid fee', () => {
    beforeEach(async () => {
      setupMocks({
        fees: [mockFeeAllPaid],
        user: { id: 'player-1', role: 'player', categoryId: 'cat-1' },
      });
      await createComponent();
      fixture.detectChanges();
    });

    it('should show paid badge', () => {
      const el = fixture.nativeElement as HTMLElement;
      const paidBadge = el.querySelector('[data-testid="paid-badge"]');
      expect(paidBadge).toBeTruthy();
    });

    it('should not show Pay button', () => {
      const el = fixture.nativeElement as HTMLElement;
      const payBtn = el.querySelector('[data-testid="pay-fee-button"]');
      expect(payBtn).toBeNull();
    });

    it('should display paid label', () => {
      const el = fixture.nativeElement as HTMLElement;
      const paidBadge = el.querySelector('[data-testid="paid-badge"]');
      expect(paidBadge?.textContent).toContain('Paid');
    });
  });

  describe('pay action', () => {
    beforeEach(async () => {
      setupMocks();
      await createComponent();
      fixture.detectChanges();
    });

    it('should call payFee with type match when Pay button is clicked', () => {
      component.onPay();
      expect(feeServiceMock.payFee).toHaveBeenCalledWith('match');
    });

    it('should set paying flag while processing', () => {
      const paySubject = new Subject();
      feeServiceMock.payFee!.mockReturnValue(paySubject.asObservable());

      component.onPay();
      expect(component.paying()).toBe(true);

      paySubject.next({
        preferenceId: 'pref-123',
        initPoint: 'https://mp.com',
        sandboxInitPoint: 'https://sandbox.mp.com',
      });
      paySubject.complete();

      expect(component.paying()).toBe(false);
    });

    it('should show error when payment fails', () => {
      feeServiceMock.payFee!.mockReturnValue(throwError(() => new Error('Payment failed')));

      component.onPay();
      fixture.detectChanges();

      expect(component.payError()).toBeTruthy();
      const el = fixture.nativeElement as HTMLElement;
      const error = el.querySelector('[data-testid="pay-error"]');
      expect(error).toBeTruthy();
    });
  });

  describe('travel fee', () => {
    it('should show travel row when travel fee exists', async () => {
      setupMocks({ fees: [mockFeeWithPending, mockTravelPending] });
      await createComponent();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const travelRow = el.querySelector('[data-testid="travel-row"]');
      expect(travelRow).toBeTruthy();
      expect(travelRow?.textContent).toContain('150');
    });

    it('should show pay travel button when travel is pending', async () => {
      setupMocks({ fees: [mockFeeWithPending, mockTravelPending] });
      await createComponent();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid="pay-travel-button"]')).toBeTruthy();
    });

    it('should show paid badge for travel when paid', async () => {
      setupMocks({ fees: [mockFeeWithPending, mockTravelPaid] });
      await createComponent();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid="travel-status-paid"]')).toBeTruthy();
    });

    it('should call payFee with travel type', async () => {
      setupMocks({ fees: [mockFeeWithPending, mockTravelPending] });
      await createComponent();
      fixture.detectChanges();

      component.onPayTravel();
      expect(feeServiceMock.payFee).toHaveBeenCalledWith('travel');
    });

    it('should not show travel row when no travel fee', async () => {
      setupMocks({ fees: [mockFeeWithPending] });
      await createComponent();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid="travel-row"]')).toBeNull();
    });
  });

  describe('pay all', () => {
    it('should show Pay All when both fee and travel are pending', async () => {
      setupMocks({ fees: [mockFeeWithPending, mockTravelPending] });
      await createComponent();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid="pay-all-button"]')).toBeTruthy();
    });

    it('should display total unpaid amount', async () => {
      setupMocks({ fees: [mockFeeWithPending, mockTravelPending] });
      await createComponent();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const total = el.querySelector('[data-testid="total-amount"]');
      expect(total?.textContent).toContain('450');
    });

    it('should not show Pay All when only one item is pending', async () => {
      setupMocks({ fees: [mockFeeWithPending, mockTravelPaid] });
      await createComponent();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid="pay-all-button"]')).toBeNull();
    });

    it('should call payAll service method', async () => {
      setupMocks({ fees: [mockFeeWithPending, mockTravelPending] });
      await createComponent();
      fixture.detectChanges();

      component.onPayAll();
      expect(feeServiceMock.payAll).toHaveBeenCalled();
    });

    it('should set payingAll flag while processing', async () => {
      setupMocks({ fees: [mockFeeWithPending, mockTravelPending] });
      await createComponent();
      fixture.detectChanges();

      const paySubject = new Subject();
      feeServiceMock.payAll!.mockReturnValue(paySubject.asObservable());

      component.onPayAll();
      expect(component.payingAll()).toBe(true);

      paySubject.next({
        preferenceId: 'pref-all',
        initPoint: 'https://mp.com/all',
        sandboxInitPoint: 'https://sandbox.mp.com/all',
      });
      paySubject.complete();
      expect(component.payingAll()).toBe(false);
    });

    it('should show error when pay all fails', async () => {
      setupMocks({ fees: [mockFeeWithPending, mockTravelPending] });
      await createComponent();
      fixture.detectChanges();

      feeServiceMock.payAll!.mockReturnValue(throwError(() => new Error('fail')));
      component.onPayAll();
      fixture.detectChanges();

      expect(component.payError()).toBeTruthy();
    });
  });

  describe('empty state', () => {
    it('should show empty message when no fees configured', async () => {
      setupMocks({ fees: [] });
      await createComponent();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const empty = el.querySelector('[data-testid="empty-state"]');
      expect(empty).toBeTruthy();
    });
  });

  describe('error state', () => {
    it('should show error when fees fail to load', async () => {
      setupMocks();
      feeServiceMock.getCurrentFees!.mockReturnValue(throwError(() => new Error('Network error')));
      await createComponent();
      fixture.detectChanges();

      expect(component.error).toBeTruthy();
      const el = fixture.nativeElement as HTMLElement;
      const errorEl = el.querySelector('[data-testid="error-state"]');
      expect(errorEl).toBeTruthy();
    });

    it('should not show fee data on error', async () => {
      setupMocks();
      feeServiceMock.getCurrentFees!.mockReturnValue(throwError(() => new Error('fail')));
      await createComponent();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid="fee-amount"]')).toBeNull();
    });
  });

  describe('captain view', () => {
    const captainFee: CategoryFee = {
      id: 'fee-1', categoryId: 'cat-1', categoryName: 'Sub 14',
      totalAmount: 3000, availablePlayers: 10, perPlayerAmount: 300,
      periodStartDate: '2026-06-15', createdBy: 'admin-1',
      createdAt: '2026-06-15T00:00:00Z', type: 'match',
      playerFees: [
        { id: 'pf-1', feeId: 'fee-1', userId: 'captain-1', playerName: 'Captain, The', status: 'paid', paidAt: '2026-06-16T10:00:00Z' },
        { id: 'pf-2', feeId: 'fee-1', userId: 'player-2', playerName: 'Two, Player', status: 'pending', paidAt: null },
        { id: 'pf-3', feeId: 'fee-1', userId: 'player-3', playerName: 'Three, Player', status: 'paid', paidAt: '2026-06-17T08:00:00Z' },
      ],
      paidCount: 2, unpaidCount: 1,
    };

    beforeEach(async () => {
      setupMocks({
        fees: [captainFee],
        user: { id: 'captain-1', role: 'captain', categoryId: 'cat-1' },
      });
      await createComponent();
      fixture.detectChanges();
    });

    it('should show player list for captain', () => {
      const el = fixture.nativeElement as HTMLElement;
      const playerItems = el.querySelectorAll('[data-testid="player-fee-item"]');
      expect(playerItems.length).toBe(3);
    });

    it('should show green badge for paid players', () => {
      const el = fixture.nativeElement as HTMLElement;
      const paidBadges = el.querySelectorAll('[data-testid="player-status-paid"]');
      expect(paidBadges.length).toBe(2);
    });

    it('should show red badge for unpaid players', () => {
      const el = fixture.nativeElement as HTMLElement;
      const unpaidBadges = el.querySelectorAll('[data-testid="player-status-pending"]');
      expect(unpaidBadges.length).toBe(1);
    });

    it('should display player names', () => {
      const el = fixture.nativeElement as HTMLElement;
      const playerItems = el.querySelectorAll('[data-testid="player-fee-item"]');
      expect(playerItems[0].textContent).toContain('Captain, The');
      expect(playerItems[1].textContent).toContain('Two, Player');
    });

    it('should show paid/unpaid summary counts', () => {
      const el = fixture.nativeElement as HTMLElement;
      const summary = el.querySelector('[data-testid="fee-summary"]');
      expect(summary?.textContent).toContain('2');
      expect(summary?.textContent).toContain('1');
    });
  });

  describe('fixture division loading', () => {
    it('should call getDivisions to resolve fixtureId for matches', async () => {
      setupMocks({ matches: [] });
      await createComponent();
      fixture.detectChanges();

      expect(fixtureServiceMock.getDivisions).toHaveBeenCalledTimes(1);
    });

    it('should call getMatches with the first division ID', async () => {
      setupMocks({ matches: [] });
      await createComponent();
      fixture.detectChanges();

      expect(fixtureServiceMock.getMatches).toHaveBeenCalledWith(206752);
    });

    it('should not call getMatches when no divisions available', async () => {
      setupMocks({ divisions: [], matches: [] });
      await createComponent();
      fixture.detectChanges();

      expect(fixtureServiceMock.getMatches).not.toHaveBeenCalled();
    });

    it('should degrade gracefully when getDivisions fails', async () => {
      setupMocks();
      fixtureServiceMock.getDivisions!.mockReturnValue(throwError(() => new Error('API down')));
      await createComponent();
      fixture.detectChanges();

      expect(component.loading).toBe(false);
      expect(component.error).toBeNull();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid="fee-amount"]')).toBeTruthy();
      expect(el.querySelector('[data-testid="warning-banner"]')).toBeNull();
    });
  });

  describe('player warning banner', () => {
    function createMatchInDays(days: number): FixtureMatch {
      const date = new Date();
      date.setDate(date.getDate() + days);
      return {
        id: 1, status: 'pending', date: date.toISOString(),
        venue: 'Stadium', round: 1,
        homeTeam: { clubId: 1, clubName: 'Team A' },
        awayTeam: { clubId: 2, clubName: 'Team B' },
        score: null,
      };
    }

    it('should show warning banner when fee is pending and next match is within 4 days', async () => {
      setupMocks({
        fees: [mockFeeWithPending],
        user: { id: 'player-1', role: 'player', categoryId: 'cat-1' },
        matches: [createMatchInDays(2)],
      });
      await createComponent();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const banner = el.querySelector('[data-testid="warning-banner"]');
      expect(banner).toBeTruthy();
    });

    it('should show warning banner when travel is pending and next match is within 4 days', async () => {
      setupMocks({
        fees: [mockFeeAllPaid, mockTravelPending],
        user: { id: 'player-1', role: 'player', categoryId: 'cat-1' },
        matches: [createMatchInDays(2)],
      });
      await createComponent();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const banner = el.querySelector('[data-testid="warning-banner"]');
      expect(banner).toBeTruthy();
    });

    it('should not show warning banner when fee is paid', async () => {
      setupMocks({
        fees: [mockFeeAllPaid],
        user: { id: 'player-1', role: 'player', categoryId: 'cat-1' },
        matches: [createMatchInDays(2)],
      });
      await createComponent();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid="warning-banner"]')).toBeNull();
    });

    it('should not show warning banner when next match is more than 4 days away', async () => {
      setupMocks({
        fees: [mockFeeWithPending],
        user: { id: 'player-1', role: 'player', categoryId: 'cat-1' },
        matches: [createMatchInDays(7)],
      });
      await createComponent();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid="warning-banner"]')).toBeNull();
    });

    it('should not show warning banner when no upcoming matches', async () => {
      setupMocks({
        fees: [mockFeeWithPending],
        user: { id: 'player-1', role: 'player', categoryId: 'cat-1' },
        matches: [],
      });
      await createComponent();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid="warning-banner"]')).toBeNull();
    });

    it('should show warning banner for captains with pending fee', async () => {
      setupMocks({
        fees: [mockFeeWithPending],
        user: { id: 'player-1', role: 'captain', categoryId: 'cat-1' },
        matches: [createMatchInDays(2)],
      });
      await createComponent();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid="warning-banner"]')).toBeTruthy();
    });

    it('should show warning for match exactly 4 days away', async () => {
      setupMocks({
        fees: [mockFeeWithPending],
        user: { id: 'player-1', role: 'player', categoryId: 'cat-1' },
        matches: [createMatchInDays(4)],
      });
      await createComponent();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const banner = el.querySelector('[data-testid="warning-banner"]');
      expect(banner).toBeTruthy();
    });

    it('should use closest upcoming match for days calculation', async () => {
      setupMocks({
        fees: [mockFeeWithPending],
        user: { id: 'player-1', role: 'player', categoryId: 'cat-1' },
        matches: [createMatchInDays(3), createMatchInDays(10)],
      });
      await createComponent();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const banner = el.querySelector('[data-testid="warning-banner"]');
      expect(banner).toBeTruthy();
    });

    it('should still show fees when fixture API fails (graceful degradation)', async () => {
      setupMocks({
        fees: [mockFeeWithPending],
        user: { id: 'player-1', role: 'player', categoryId: 'cat-1' },
      });
      fixtureServiceMock.getMatches!.mockReturnValue(throwError(() => new Error('Fixture API down')));
      await createComponent();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid="fee-amount"]')).toBeTruthy();
      expect(el.querySelector('[data-testid="warning-banner"]')).toBeNull();
      expect(el.querySelector('[data-testid="error-state"]')).toBeNull();
    });
  });

  describe('payment flash messages', () => {
    it('should show success flash when payment=success query param', async () => {
      setupMocks();
      await createComponent({ payment: 'success' });
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const flash = el.querySelector('[data-testid="payment-flash-success"]');
      expect(flash).toBeTruthy();
      expect(flash?.textContent).toContain('Payment completed successfully');
    });

    it('should show error flash when payment=failure query param', async () => {
      setupMocks();
      await createComponent({ payment: 'failure' });
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const flash = el.querySelector('[data-testid="payment-flash-error"]');
      expect(flash).toBeTruthy();
      expect(flash?.textContent).toContain('Payment failed');
    });

    it('should show pending flash when payment=pending query param', async () => {
      setupMocks();
      await createComponent({ payment: 'pending' });
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const flash = el.querySelector('[data-testid="payment-flash-pending"]');
      expect(flash).toBeTruthy();
      expect(flash?.textContent).toContain('being processed');
    });

    it('should not show flash when no payment query param', async () => {
      setupMocks();
      await createComponent();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid="payment-flash-success"]')).toBeNull();
      expect(el.querySelector('[data-testid="payment-flash-error"]')).toBeNull();
      expect(el.querySelector('[data-testid="payment-flash-pending"]')).toBeNull();
    });
  });
});
