import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AdminFeesComponent } from './fees.component';
import { FeeService } from '../../../services/fee.service';
import { PlayerService } from '../../../services/player.service';
import { of, throwError } from 'rxjs';
import { CategoryFee } from '../../../models/fee.model';
import { Category } from '../../../models/player.model';

const mockCategories: Category[] = [
  { id: 'cat-1', name: 'Sub 14' },
  { id: 'cat-2', name: 'Sub 16' },
  { id: 'cat-3', name: 'Sub 19' },
  { id: 'cat-4', name: 'Primera' },
  { id: 'cat-5', name: 'Intermedia' },
  { id: 'cat-6', name: 'Caballeros' },
];

const mockFees: CategoryFee[] = [
  {
    id: 'fee-1', categoryId: 'cat-1', categoryName: 'Sub 14',
    totalAmount: 3000, availablePlayers: 10, perPlayerAmount: 300,
    weekStartDate: '2026-06-15', createdBy: 'admin-1',
    createdAt: '2026-06-15T00:00:00Z',
    playerFees: [
      { id: 'pf-1', categoryFeeId: 'fee-1', userId: 'u1', playerName: 'Alvarez, Mateo', status: 'paid', paidAt: '2026-06-16T10:00:00Z' },
      { id: 'pf-2', categoryFeeId: 'fee-1', userId: 'u2', playerName: 'Bravo, Valentina', status: 'pending', paidAt: null },
    ],
    paidCount: 1, unpaidCount: 1,
  },
  {
    id: 'fee-2', categoryId: 'cat-2', categoryName: 'Sub 16',
    totalAmount: 5000, availablePlayers: 15, perPlayerAmount: 333.33,
    weekStartDate: '2026-06-15', createdBy: 'admin-1',
    createdAt: '2026-06-15T00:00:00Z',
    playerFees: [],
    paidCount: 0, unpaidCount: 0,
  },
];

describe('AdminFeesComponent', () => {
  let component: AdminFeesComponent;
  let fixture: ComponentFixture<AdminFeesComponent>;
  let feeService: jest.Mocked<FeeService>;
  let playerService: jest.Mocked<PlayerService>;

  beforeEach(async () => {
    const feeServiceMock = {
      getCurrentFees: jest.fn().mockReturnValue(of(mockFees)),
      createFee: jest.fn(),
      markPlayerPaid: jest.fn(),
    };

    const playerServiceMock = {
      getCategories: jest.fn().mockReturnValue(of(mockCategories)),
      getPlayersByCategory: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AdminFeesComponent],
      providers: [
        { provide: FeeService, useValue: feeServiceMock },
        { provide: PlayerService, useValue: playerServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminFeesComponent);
    component = fixture.componentInstance;
    feeService = TestBed.inject(FeeService) as jest.Mocked<FeeService>;
    playerService = TestBed.inject(PlayerService) as jest.Mocked<PlayerService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load fees and categories on init', () => {
    expect(feeService.getCurrentFees).toHaveBeenCalled();
    expect(playerService.getCategories).toHaveBeenCalled();
    expect(component.fees).toEqual(mockFees);
    expect(component.categories).toEqual(mockCategories);
  });

  it('should display fee cards for configured categories', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('[data-testid="fee-card"]');
    expect(cards.length).toBe(2);
  });

  it('should show total amount, available players, and per-player amount', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const firstCard = compiled.querySelector('[data-testid="fee-card"]');
    expect(firstCard?.textContent).toContain('3,000');
    expect(firstCard?.textContent).toContain('10');
    expect(firstCard?.textContent).toContain('300.00');
  });

  it('should show paid and unpaid counts', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const firstCard = compiled.querySelector('[data-testid="fee-card"]');
    expect(firstCard?.textContent).toContain('1');
  });

  it('should show category name as card title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const titles = compiled.querySelectorAll('[data-testid="fee-category-name"]');
    expect(titles[0].textContent?.trim()).toBe('Sub 14');
    expect(titles[1].textContent?.trim()).toBe('Sub 16');
  });

  it('should show error when loading fails', () => {
    feeService.getCurrentFees.mockReturnValue(throwError(() => new Error('fail')));

    const newFixture = TestBed.createComponent(AdminFeesComponent);
    newFixture.detectChanges();
    const compiled = newFixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('[data-testid="error-state"]')).toBeTruthy();
  });

  describe('create fee form', () => {
    it('should show form when configure button is clicked', () => {
      component.openConfigForm('cat-3');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('[data-testid="fee-form"]')).toBeTruthy();
    });

    it('should create fee and reload on submit', fakeAsync(() => {
      const newFee: CategoryFee = {
        id: 'fee-3', categoryId: 'cat-3', categoryName: 'Sub 19',
        totalAmount: 2000, availablePlayers: 8, perPlayerAmount: 250,
        weekStartDate: '2026-06-15', createdBy: 'admin-1',
        createdAt: '2026-06-15T00:00:00Z', playerFees: [],
        paidCount: 0, unpaidCount: 0,
      };
      feeService.createFee.mockReturnValue(of(newFee));
      feeService.getCurrentFees.mockReturnValue(of([...mockFees, newFee]));

      component.openConfigForm('cat-3');
      component.formData.totalAmount = 2000;
      component.formData.availablePlayers = 8;
      component.onSubmit();
      tick();
      fixture.detectChanges();

      expect(feeService.createFee).toHaveBeenCalledWith({
        categoryId: 'cat-3',
        totalAmount: 2000,
        availablePlayers: 8,
      });
      expect(component.showForm()).toBe(false);
    }));

    it('should close form on cancel', () => {
      component.openConfigForm('cat-3');
      fixture.detectChanges();
      expect(component.showForm()).toBe(true);

      component.closeForm();
      fixture.detectChanges();
      expect(component.showForm()).toBe(false);
    });
  });

  describe('mark player paid', () => {
    it('should call markPlayerPaid and reload fees', fakeAsync(() => {
      const updatedPlayerFee = {
        id: 'pf-2', categoryFeeId: 'fee-1', userId: 'u2',
        playerName: 'Bravo, Valentina', status: 'paid' as const,
        paidAt: '2026-06-16T11:00:00Z',
      };
      feeService.markPlayerPaid.mockReturnValue(of(updatedPlayerFee));
      feeService.getCurrentFees.mockReturnValue(of(mockFees));

      component.onMarkPaid('pf-2');
      tick();

      expect(feeService.markPlayerPaid).toHaveBeenCalledWith('pf-2');
      expect(feeService.getCurrentFees).toHaveBeenCalledTimes(2);
    }));
  });

  describe('unconfigured categories', () => {
    it('should list categories without fee configuration', () => {
      expect(component.unconfiguredCategories.length).toBe(4);
      expect(component.unconfiguredCategories[0].id).toBe('cat-3');
    });
  });
});
