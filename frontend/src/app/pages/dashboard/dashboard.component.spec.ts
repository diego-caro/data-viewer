import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { PlayerService } from '../../services/player.service';
import { Category, Player } from '../../models/player.model';

const mockCategories: Category[] = [
  { id: 'cat-1', name: 'Mixto Sub 14 A' },
  { id: 'cat-2', name: 'Mixto Sub 14 B' },
  { id: 'cat-3', name: 'Mixto Sub 16' },
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

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let playerServiceMock: jest.Mocked<PlayerService>;

  beforeEach(async () => {
    playerServiceMock = {
      getCategories: jest.fn().mockReturnValue(of(mockCategories)),
      getPlayersByCategory: jest.fn().mockImplementation((categoryId: string) => {
        const playersMap: Record<string, Player[]> = {
          'cat-1': mockPlayersCat1,
          'cat-2': mockPlayersCat2,
          'cat-3': mockPlayersCat3,
        };
        return of({
          data: playersMap[categoryId] ?? [],
          category: mockCategories.find((c) => c.id === categoryId) ?? null,
        });
      }),
    } as unknown as jest.Mocked<PlayerService>;

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [{ provide: PlayerService, useValue: playerServiceMock }],
    }).compileComponents();

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
    });

    it('should create chart data for each category', () => {
      fixture.detectChanges();
      expect(component.categoryCharts.length).toBe(3);
    });

    it('should compute correct active/inactive counts for cat-1', () => {
      fixture.detectChanges();
      const chart = component.categoryCharts.find((c) => c.categoryName === 'Mixto Sub 14 A');
      expect(chart).toBeTruthy();
      expect(chart!.activeCount).toBe(2);
      expect(chart!.inactiveCount).toBe(1);
    });

    it('should compute correct active/inactive counts for cat-2', () => {
      fixture.detectChanges();
      const chart = component.categoryCharts.find((c) => c.categoryName === 'Mixto Sub 14 B');
      expect(chart).toBeTruthy();
      expect(chart!.activeCount).toBe(1);
      expect(chart!.inactiveCount).toBe(1);
    });

    it('should mark category with no players as empty', () => {
      fixture.detectChanges();
      const chart = component.categoryCharts.find((c) => c.categoryName === 'Mixto Sub 16');
      expect(chart).toBeTruthy();
      expect(chart!.isEmpty).toBe(true);
      expect(chart!.activeCount).toBe(0);
      expect(chart!.inactiveCount).toBe(0);
    });

    it('should render one chart card per category', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const cards = compiled.querySelectorAll('[data-testid="chart-card"]');
      expect(cards.length).toBe(3);
    });

    it('should display category name as chart title', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const titles = compiled.querySelectorAll('[data-testid="chart-title"]');
      expect(titles.length).toBe(3);
      expect(titles[0].textContent?.trim()).toBe('Mixto Sub 14 A');
      expect(titles[1].textContent?.trim()).toBe('Mixto Sub 14 B');
      expect(titles[2].textContent?.trim()).toBe('Mixto Sub 16');
    });

    it('should show a canvas for categories with players', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const canvases = compiled.querySelectorAll('canvas');
      expect(canvases.length).toBe(2);
    });

    it('should show empty state text for category with no players', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const emptyStates = compiled.querySelectorAll('[data-testid="chart-empty"]');
      expect(emptyStates.length).toBe(1);
      expect(emptyStates[0].textContent?.trim()).toBe('No players');
    });

    it('should display active and inactive counts as legend', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const legends = compiled.querySelectorAll('[data-testid="chart-legend"]');
      expect(legends.length).toBe(2);

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
      expect(errorEl?.textContent).toContain('Unable to load dashboard data');
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
});
