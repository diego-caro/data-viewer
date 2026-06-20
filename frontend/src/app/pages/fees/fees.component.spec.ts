import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { PlayerFeesComponent } from './fees.component';
import { FeeService } from '../../services/fee.service';
import { AuthService } from '../../services/auth.service';
import { FixtureService } from '../../services/fixture.service';
import { CategoryFee } from '../../models/fee.model';
import { FixtureMatch } from '../../models/fixture.model';

const mockFeeWithPending: CategoryFee = {
  id: 'fee-1', categoryId: 'cat-1', categoryName: 'Sub 14',
  totalAmount: 3000, availablePlayers: 10, perPlayerAmount: 300,
  weekStartDate: '2026-06-15', createdBy: 'admin-1',
  createdAt: '2026-06-15T00:00:00Z',
  playerFees: [
    { id: 'pf-1', categoryFeeId: 'fee-1', userId: 'player-1', playerName: 'One, Player', status: 'pending', paidAt: null },
    { id: 'pf-2', categoryFeeId: 'fee-1', userId: 'player-2', playerName: 'Two, Player', status: 'paid', paidAt: '2026-06-16T10:00:00Z' },
  ],
  paidCount: 1, unpaidCount: 1,
};

const mockFeeAllPaid: CategoryFee = {
  ...mockFeeWithPending,
  playerFees: [
    { id: 'pf-1', categoryFeeId: 'fee-1', userId: 'player-1', playerName: 'One, Player', status: 'paid', paidAt: '2026-06-16T10:00:00Z' },
  ],
  paidCount: 1, unpaidCount: 0,
};

describe('PlayerFeesComponent', () => {
  let component: PlayerFeesComponent;
  let fixture: ComponentFixture<PlayerFeesComponent>;
  let feeServiceMock: jest.Mocked<Partial<FeeService>>;
  let authServiceMock: Partial<AuthService>;
  let fixtureServiceMock: jest.Mocked<Partial<FixtureService>>;

  function setupMocks(overrides?: {
    fees?: CategoryFee[];
    user?: { id: string; role: string; categoryId: string | null };
    matches?: FixtureMatch[];
  }) {
    const fees = overrides?.fees ?? [mockFeeWithPending];
    const user = overrides?.user ?? { id: 'player-1', role: 'player', categoryId: 'cat-1' };
    const matches = overrides?.matches ?? [];

    feeServiceMock = {
      getCurrentFees: jest.fn().mockReturnValue(of(fees)),
      payFee: jest.fn().mockReturnValue(of({
        preferenceId: 'pref-123',
        initPoint: 'https://www.mercadopago.com/checkout/v1/redirect?pref_id=pref-123',
        sandboxInitPoint: 'https://sandbox.mercadopago.com/checkout',
      })),
    };

    authServiceMock = {
      user: jest.fn().mockReturnValue(user) as unknown as AuthService['user'],
    };

    fixtureServiceMock = {
      getMatches: jest.fn().mockReturnValue(of(matches)),
    };
  }

  async function createComponent() {
    await TestBed.configureTestingModule({
      imports: [PlayerFeesComponent],
      providers: [
        { provide: FeeService, useValue: feeServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: FixtureService, useValue: fixtureServiceMock },
      ],
    }).compileComponents();

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
      const payBtn = el.querySelector('[data-testid="pay-button"]');
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
      const payBtn = el.querySelector('[data-testid="pay-button"]');
      expect(payBtn).toBeNull();
    });

    it('should display paid date', () => {
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

    it('should call payFee when Pay button is clicked', () => {
      const originalOpen = window.open;
      window.open = jest.fn();

      component.onPay();
      expect(feeServiceMock.payFee).toHaveBeenCalled();

      window.open = originalOpen;
    });

    it('should set paying flag while processing', () => {
      const originalOpen = window.open;
      window.open = jest.fn();

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
      window.open = originalOpen;
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
      weekStartDate: '2026-06-15', createdBy: 'admin-1',
      createdAt: '2026-06-15T00:00:00Z',
      playerFees: [
        { id: 'pf-1', categoryFeeId: 'fee-1', userId: 'captain-1', playerName: 'Captain, The', status: 'paid', paidAt: '2026-06-16T10:00:00Z' },
        { id: 'pf-2', categoryFeeId: 'fee-1', userId: 'player-2', playerName: 'Two, Player', status: 'pending', paidAt: null },
        { id: 'pf-3', categoryFeeId: 'fee-1', userId: 'player-3', playerName: 'Three, Player', status: 'paid', paidAt: '2026-06-17T08:00:00Z' },
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

    it('should not show player-only Pay button', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid="pay-button"]')).toBeNull();
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
      expect(banner?.textContent).toContain('300');
      expect(banner?.textContent).toContain('2');
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

    it('should not show warning banner for captains', async () => {
      setupMocks({
        fees: [mockFeeWithPending],
        user: { id: 'player-1', role: 'captain', categoryId: 'cat-1' },
        matches: [createMatchInDays(2)],
      });
      await createComponent();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid="warning-banner"]')).toBeNull();
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
      expect(banner?.textContent).toContain('3');
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
});
