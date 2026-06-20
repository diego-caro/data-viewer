import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { PlayerFeesComponent } from './fees.component';
import { FeeService } from '../../services/fee.service';
import { AuthService } from '../../services/auth.service';
import { CategoryFee } from '../../models/fee.model';

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

  function setupMocks(overrides?: {
    fees?: CategoryFee[];
    user?: { id: string; role: string; categoryId: string | null };
  }) {
    const fees = overrides?.fees ?? [mockFeeWithPending];
    const user = overrides?.user ?? { id: 'player-1', role: 'player', categoryId: 'cat-1' };

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
  }

  async function createComponent() {
    await TestBed.configureTestingModule({
      imports: [PlayerFeesComponent],
      providers: [
        { provide: FeeService, useValue: feeServiceMock },
        { provide: AuthService, useValue: authServiceMock },
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
});
