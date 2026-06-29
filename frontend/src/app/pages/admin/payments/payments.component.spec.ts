import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { AdminFeesComponent } from './payments.component';
import { FeeService } from '../../../services/payment.service';
import { PlayerService } from '../../../services/player.service';
import { FixtureService } from '../../../services/fixture.service';
import { provideTranslateTesting, setupTestTranslations } from '../../../testing/translate-testing';
import { of, throwError } from 'rxjs';
import { CategoryFee, PaymentType } from '../../../models/payment.model';
import { Category } from '../../../models/player.model';
import { FixtureDivision, FixtureMatch } from '../../../models/fixture.model';

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
    periodStartDate: '2026-06-15', createdBy: 'admin-1',
    createdAt: '2026-06-15T00:00:00Z', type: 'match',
    playerFees: [
      { id: 'pf-1', feeId: 'fee-1', userId: 'u1', playerName: 'Alvarez, Mateo', status: 'paid', paidAt: '2026-06-16T10:00:00Z' },
      { id: 'pf-2', feeId: 'fee-1', userId: 'u2', playerName: 'Bravo, Valentina', status: 'pending', paidAt: null },
    ],
    paidCount: 1, unpaidCount: 1,
  },
  {
    id: 'fee-2', categoryId: 'cat-2', categoryName: 'Sub 16',
    totalAmount: 5000, availablePlayers: 15, perPlayerAmount: 333.33,
    periodStartDate: '2026-06-15', createdBy: 'admin-1',
    createdAt: '2026-06-15T00:00:00Z', type: 'match',
    playerFees: [],
    paidCount: 0, unpaidCount: 0,
  },
];

const mockTravelFees: CategoryFee[] = [
  {
    id: 'travel-1', categoryId: 'cat-1', categoryName: 'Sub 14',
    totalAmount: 1500, availablePlayers: 10, perPlayerAmount: 150,
    periodStartDate: '2026-06-15', createdBy: 'admin-1',
    createdAt: '2026-06-15T00:00:00Z', type: 'travel',
    playerFees: [
      { id: 'tpf-1', feeId: 'travel-1', userId: 'u1', playerName: 'Alvarez, Mateo', status: 'pending', paidAt: null },
    ],
    paidCount: 0, unpaidCount: 1,
  },
];

const MOCK_DIVISIONS: FixtureDivision[] = [
  { id: 206752, name: 'Mixto Sub 14 A' },
];

function createMatchInDays(days: number, isAway: boolean): FixtureMatch {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return {
    id: 1, status: 'pending', date: date.toISOString(),
    venue: 'Stadium', round: 1,
    homeTeam: { clubId: isAway ? 99 : 1, clubName: isAway ? 'Rival FC' : 'Club Empleados de Comercio' },
    awayTeam: { clubId: isAway ? 1 : 99, clubName: isAway ? 'Club Empleados de Comercio' : 'Rival FC' },
    score: null,
  };
}

describe('AdminFeesComponent', () => {
  let component: AdminFeesComponent;
  let fixture: ComponentFixture<AdminFeesComponent>;
  let feeService: jest.Mocked<FeeService>;
  let playerService: jest.Mocked<PlayerService>;
  let fixtureService: jest.Mocked<Partial<FixtureService>>;

  beforeEach(async () => {
    const feeServiceMock = {
      getCurrentFees: jest.fn().mockReturnValue(of([...mockFees, ...mockTravelFees])),
      createFee: jest.fn(),
      markPlayerPaid: jest.fn(),
    };

    const playerServiceMock = {
      getCategories: jest.fn().mockReturnValue(of(mockCategories)),
      getPlayersByCategory: jest.fn(),
    };

    const fixtureServiceMock = {
      getDivisions: jest.fn().mockReturnValue(of(MOCK_DIVISIONS)),
      getMatches: jest.fn().mockReturnValue(of([createMatchInDays(3, true)])),
    };

    await TestBed.configureTestingModule({
      imports: [AdminFeesComponent],
      providers: [
        { provide: FeeService, useValue: feeServiceMock },
        { provide: PlayerService, useValue: playerServiceMock },
        { provide: FixtureService, useValue: fixtureServiceMock },
        ...provideTranslateTesting(),
      ],
    }).compileComponents();

    setupTestTranslations(TestBed.inject(TranslateService));
    fixture = TestBed.createComponent(AdminFeesComponent);
    component = fixture.componentInstance;
    feeService = TestBed.inject(FeeService) as jest.Mocked<FeeService>;
    playerService = TestBed.inject(PlayerService) as jest.Mocked<PlayerService>;
    fixtureService = TestBed.inject(FixtureService) as jest.Mocked<Partial<FixtureService>>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load fees and categories on init', () => {
    expect(feeService.getCurrentFees).toHaveBeenCalled();
    expect(playerService.getCategories).toHaveBeenCalled();
    expect(component.fees.length).toBe(3);
    expect(component.categories).toEqual(mockCategories);
  });

  it('should default to match tab', () => {
    expect(component.activeTab).toBe('match');
  });

  it('should display only match-type cards when match tab is active', () => {
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

  describe('tabs', () => {
    it('should render tab buttons', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('[data-testid="tab-match"]')).toBeTruthy();
      expect(compiled.querySelector('[data-testid="tab-league"]')).toBeTruthy();
      expect(compiled.querySelector('[data-testid="tab-travel"]')).toBeTruthy();
    });

    it('should switch to travel tab and show travel fees', () => {
      component.setTab('travel');
      fixture.detectChanges();

      expect(component.activeTab).toBe('travel');
      const compiled = fixture.nativeElement as HTMLElement;
      const cards = compiled.querySelectorAll('[data-testid="fee-card"]');
      expect(cards.length).toBe(1);
      expect(cards[0].textContent).toContain('Sub 14');
      expect(cards[0].textContent).toContain('1,500');
    });

    it('should show away badge when travel tab is active and match is away', () => {
      component.setTab('travel');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const badge = compiled.querySelector('[data-testid="away-badge"]');
      expect(badge).toBeTruthy();
      expect(badge?.textContent?.trim()).toBe('Away');
    });

    it('should not show away badge on match tab', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('[data-testid="away-badge"]')).toBeNull();
    });

    it('should show local badge when match is not away', async () => {
      (fixtureService.getMatches as jest.Mock).mockReturnValue(of([createMatchInDays(3, false)]));

      const newFixture = TestBed.createComponent(AdminFeesComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      newComponent.setTab('travel');
      newFixture.detectChanges();

      const compiled = newFixture.nativeElement as HTMLElement;
      const badge = compiled.querySelector('[data-testid="away-badge"]');
      expect(badge).toBeTruthy();
      expect(badge?.textContent?.trim()).toBe('Local');
    });

    it('should filter unconfigured categories by active tab', () => {
      expect(component.unconfiguredCategories.length).toBe(4);

      component.setTab('travel');
      expect(component.unconfiguredCategories.length).toBe(5);
    });
  });

  describe('create fee form', () => {
    it('should show form when configure button is clicked', () => {
      component.openConfigForm('cat-3');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('[data-testid="fee-form"]')).toBeTruthy();
    });

    it('should create fee with type and reload on submit', fakeAsync(() => {
      const newFee: CategoryFee = {
        id: 'fee-3', categoryId: 'cat-3', categoryName: 'Sub 19',
        totalAmount: 2000, availablePlayers: 8, perPlayerAmount: 250,
        periodStartDate: '2026-06-15', createdBy: 'admin-1',
        createdAt: '2026-06-15T00:00:00Z', type: 'match', playerFees: [],
        paidCount: 0, unpaidCount: 0,
      };
      feeService.createFee.mockReturnValue(of(newFee));
      feeService.getCurrentFees.mockReturnValue(of([...mockFees, newFee, ...mockTravelFees]));

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
        type: 'match',
      });
      expect(component.showForm()).toBe(false);
    }));

    it('should create travel fee when travel tab is active', fakeAsync(() => {
      const newTravel: CategoryFee = {
        id: 'travel-2', categoryId: 'cat-2', categoryName: 'Sub 16',
        totalAmount: 1000, availablePlayers: 15, perPlayerAmount: 66.67,
        periodStartDate: '2026-06-15', createdBy: 'admin-1',
        createdAt: '2026-06-15T00:00:00Z', type: 'travel', playerFees: [],
        paidCount: 0, unpaidCount: 0,
      };
      feeService.createFee.mockReturnValue(of(newTravel));
      feeService.getCurrentFees.mockReturnValue(of([...mockFees, ...mockTravelFees, newTravel]));

      component.setTab('travel');
      component.openConfigForm('cat-2');
      component.formData.totalAmount = 1000;
      component.formData.availablePlayers = 15;
      component.onSubmit();
      tick();

      expect(feeService.createFee).toHaveBeenCalledWith({
        categoryId: 'cat-2',
        totalAmount: 1000,
        availablePlayers: 15,
        type: 'travel',
      });
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
        id: 'pf-2', feeId: 'fee-1', userId: 'u2',
        playerName: 'Bravo, Valentina', status: 'paid' as const,
        paidAt: '2026-06-16T11:00:00Z',
      };
      feeService.markPlayerPaid.mockReturnValue(of(updatedPlayerFee));
      feeService.getCurrentFees.mockReturnValue(of([...mockFees, ...mockTravelFees]));

      component.onMarkPaid('pf-2');
      tick();

      expect(feeService.markPlayerPaid).toHaveBeenCalledWith('pf-2');
    }));
  });

  describe('unconfigured categories', () => {
    it('should list categories without fee configuration', () => {
      expect(component.unconfiguredCategories.length).toBe(4);
      expect(component.unconfiguredCategories[0].id).toBe('cat-3');
    });
  });

  describe('fixture service error handling', () => {
    it('should handle fixture service failure gracefully', async () => {
      (fixtureService.getDivisions as jest.Mock).mockReturnValue(throwError(() => new Error('API down')));

      const newFixture = TestBed.createComponent(AdminFeesComponent);
      newFixture.detectChanges();

      const newComponent = newFixture.componentInstance;
      expect(newComponent.isAway).toBe(false);
      expect(newComponent.error).toBeNull();
    });
  });
});
