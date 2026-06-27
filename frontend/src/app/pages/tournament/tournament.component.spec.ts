import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { of, throwError, NEVER } from 'rxjs';
import { TournamentComponent } from './tournament.component';
import { FixtureService } from '../../services/fixture.service';
import { provideTranslateTesting, setupTestTranslations } from '../../testing/translate-testing';
import { FixtureMatch, FixtureClub, FixtureDivision, StandingsEntry } from '../../models/fixture.model';

const MOCK_DIVISIONS: FixtureDivision[] = [
  { id: 206752, name: 'Mixto Sub 14 A' },
  { id: 206754, name: 'Caballeros Primera' },
];

const MOCK_MATCHES: FixtureMatch[] = [
  {
    id: 207519,
    status: 'completed',
    date: '2026-06-06T13:30:00Z',
    venue: 'Bigornia',
    round: 1,
    homeTeam: { clubId: 3, clubName: 'Bigornia Club' },
    awayTeam: { clubId: 5, clubName: 'Club Empleados de Comercio' },
    score: { home: 2, away: 2 },
  },
  {
    id: 208130,
    status: 'pending',
    date: '2026-06-20T03:00:00Z',
    venue: 'C.E.C. Hockey',
    round: 3,
    homeTeam: { clubId: 5, clubName: 'Club Empleados de Comercio' },
    awayTeam: { clubId: 12, clubName: 'Trelew R.C.' },
    score: null,
  },
];

const MOCK_CLUBS: FixtureClub[] = [
  { id: 3, name: 'Bigornia Club', logo: 'base64logo3' },
  { id: 5, name: 'Club Empleados de Comercio', logo: null },
  { id: 12, name: 'Trelew R.C.', logo: 'base64logo12' },
];

const MOCK_STANDINGS: StandingsEntry[] = [
  {
    position: 1,
    clubId: 5,
    clubName: 'Club Empleados de Comercio',
    clubLogo: 'base64logo5',
    points: 9,
    played: 3,
    won: 3,
    drawn: 0,
    lost: 0,
    goalsFor: 8,
    goalsAgainst: 2,
    goalDifference: 6,
  },
  {
    position: 2,
    clubId: 6,
    clubName: 'Puerto Madryn Rugby Club',
    clubLogo: null,
    points: 6,
    played: 3,
    won: 2,
    drawn: 0,
    lost: 1,
    goalsFor: 7,
    goalsAgainst: 6,
    goalDifference: 1,
  },
];

describe('TournamentComponent', () => {
  let component: TournamentComponent;
  let fixture: ComponentFixture<TournamentComponent>;
  let fixtureServiceMock: jest.Mocked<FixtureService>;

  function setupMocks(overrides: Partial<jest.Mocked<FixtureService>> = {}): void {
    fixtureServiceMock.getDivisions.mockReturnValue(overrides.getDivisions?.() ?? of(MOCK_DIVISIONS));
    fixtureServiceMock.getMatches.mockReturnValue(overrides.getMatches?.() ?? of(MOCK_MATCHES));
    fixtureServiceMock.getClubs.mockReturnValue(overrides.getClubs?.() ?? of(MOCK_CLUBS));
    fixtureServiceMock.getStandings.mockReturnValue(overrides.getStandings?.() ?? of(MOCK_STANDINGS));
  }

  beforeEach(async () => {
    fixtureServiceMock = {
      getDivisions: jest.fn().mockReturnValue(of(MOCK_DIVISIONS)),
      getMatches: jest.fn().mockReturnValue(of(MOCK_MATCHES)),
      getClubs: jest.fn().mockReturnValue(of(MOCK_CLUBS)),
      getStandings: jest.fn().mockReturnValue(of(MOCK_STANDINGS)),
    } as unknown as jest.Mocked<FixtureService>;

    await TestBed.configureTestingModule({
      imports: [TournamentComponent],
      providers: [{ provide: FixtureService, useValue: fixtureServiceMock }, ...provideTranslateTesting()],
    }).compileComponents();

    setupTestTranslations(TestBed.inject(TranslateService));
    fixture = TestBed.createComponent(TournamentComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('loading state', () => {
    it('should show loading while divisions are loading', () => {
      fixtureServiceMock.getDivisions.mockReturnValue(NEVER);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid="loading-state"]')).toBeTruthy();
    });

    it('should hide loading after divisions load', () => {
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid="loading-state"]')).toBeNull();
    });
  });

  describe('divisions', () => {
    it('should fetch divisions on init', () => {
      fixture.detectChanges();
      expect(fixtureServiceMock.getDivisions).toHaveBeenCalledTimes(1);
    });

    it('should render division dropdown', () => {
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const select = el.querySelector('[data-testid="division-select"]');
      expect(select).toBeTruthy();
    });

    it('should render all division options', () => {
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const options = el.querySelectorAll('[data-testid="division-select"] option');
      expect(options.length).toBe(MOCK_DIVISIONS.length);
    });

    it('should select first division by default', () => {
      fixture.detectChanges();
      expect(component.selectedDivisionId()).toBe(206752);
    });

    it('should load fixture and standings for first division on init', () => {
      fixture.detectChanges();
      expect(fixtureServiceMock.getMatches).toHaveBeenCalledWith(206752);
      expect(fixtureServiceMock.getClubs).toHaveBeenCalledWith(206752);
      expect(fixtureServiceMock.getStandings).toHaveBeenCalledWith(206752);
    });

    it('should reload data when division changes', () => {
      fixture.detectChanges();
      component.onDivisionChange(206754);
      expect(fixtureServiceMock.getMatches).toHaveBeenCalledWith(206754);
      expect(fixtureServiceMock.getClubs).toHaveBeenCalledWith(206754);
      expect(fixtureServiceMock.getStandings).toHaveBeenCalledWith(206754);
    });

    it('should filter divisions to only those where the club plays', () => {
      const standingsWithoutClub: StandingsEntry[] = [
        { position: 1, clubId: 99, clubName: 'Other Club', clubLogo: null, points: 3, played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 2, goalsAgainst: 0, goalDifference: 2 },
      ];
      fixtureServiceMock.getStandings.mockImplementation((id: number) =>
        id === 206752 ? of(MOCK_STANDINGS) : of(standingsWithoutClub)
      );
      fixture.detectChanges();
      expect(component.divisions).toHaveLength(1);
      expect(component.divisions[0].id).toBe(206752);
    });

    it('should handle individual standings request failure gracefully', () => {
      fixtureServiceMock.getStandings.mockImplementation((id: number) =>
        id === 206752 ? of(MOCK_STANDINGS) : throwError(() => new Error('fail'))
      );
      fixture.detectChanges();
      expect(component.divisions).toHaveLength(1);
      expect(component.divisions[0].id).toBe(206752);
    });

    it('should show error when divisions fail to load', () => {
      fixtureServiceMock.getDivisions.mockReturnValue(throwError(() => new Error('Network error')));
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid="error-state"]')).toBeTruthy();
    });
  });

  describe('tabs', () => {
    it('should render fixture and standings tabs', () => {
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid="tab-fixture"]')).toBeTruthy();
      expect(el.querySelector('[data-testid="tab-standings"]')).toBeTruthy();
    });

    it('should default to fixture tab', () => {
      fixture.detectChanges();
      expect(component.activeTab()).toBe('fixture');
    });

    it('should switch to standings tab', () => {
      fixture.detectChanges();
      component.setActiveTab('standings');
      fixture.detectChanges();
      expect(component.activeTab()).toBe('standings');
    });

    it('should show fixture content when fixture tab active', () => {
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid="fixture-content"]')).toBeTruthy();
      expect(el.querySelector('[data-testid="standings-content"]')).toBeNull();
    });

    it('should show standings content when standings tab active', () => {
      fixture.detectChanges();
      component.setActiveTab('standings');
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid="standings-content"]')).toBeTruthy();
      expect(el.querySelector('[data-testid="fixture-content"]')).toBeNull();
    });
  });

  describe('fixture tab', () => {
    it('should group matches into rounds', () => {
      fixture.detectChanges();
      expect(component.rounds).toHaveLength(2);
      expect(component.rounds[0].number).toBe(1);
      expect(component.rounds[1].number).toBe(3);
    });

    it('should display completed match scores', () => {
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const scores = el.querySelectorAll('[data-testid="match-score"]');
      expect(scores.length).toBe(1);
      expect(scores[0]?.textContent?.trim()).toContain('2');
    });

    it('should display VS for pending matches', () => {
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const pending = el.querySelector('[data-testid="match-date-pending"]');
      expect(pending).toBeTruthy();
    });

    it('should display venue names', () => {
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const venues = el.querySelectorAll('[data-testid="match-venue"]');
      expect(venues.length).toBe(2);
      expect(venues[0]?.textContent).toContain('Bigornia');
    });

    it('should show empty state when no matches', () => {
      fixtureServiceMock.getMatches.mockReturnValue(of([]));
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid="fixture-empty"]')).toBeTruthy();
    });

    it('should show error when fixture fails to load', () => {
      fixtureServiceMock.getMatches.mockReturnValue(throwError(() => new Error('Network error')));
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid="fixture-error"]')).toBeTruthy();
    });

    it('should show loading while fixture is loading', () => {
      fixtureServiceMock.getMatches.mockReturnValue(NEVER);
      fixtureServiceMock.getClubs.mockReturnValue(NEVER);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid="fixture-loading"]')).toBeTruthy();
    });

    it('should build club logo map', () => {
      fixture.detectChanges();
      expect(component.getClubLogo(3)).toBe('base64logo3');
      expect(component.getClubLogo(5)).toBeNull();
      expect(component.getClubLogo(999)).toBeNull();
    });

    it('should render team logos', () => {
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelectorAll('[data-testid="team-logo"]').length).toBeGreaterThan(0);
    });

    it('should render team logo placeholders', () => {
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelectorAll('[data-testid="team-logo-placeholder"]').length).toBeGreaterThan(0);
    });
  });

  describe('standings tab', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.setActiveTab('standings');
      fixture.detectChanges();
    });

    it('should render standings table', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid="standings-table"]')).toBeTruthy();
    });

    it('should render all standings rows', () => {
      const el = fixture.nativeElement as HTMLElement;
      const rows = el.querySelectorAll('[data-testid="standings-row"]');
      expect(rows.length).toBe(2);
    });

    it('should display position, club name, and points', () => {
      const el = fixture.nativeElement as HTMLElement;
      const rows = el.querySelectorAll('[data-testid="standings-row"]');
      const firstRow = rows[0];
      expect(firstRow.textContent).toContain('1');
      expect(firstRow.textContent).toContain('Club Empleados de Comercio');
      expect(firstRow.textContent).toContain('9');
    });

    it('should display all stats columns', () => {
      const el = fixture.nativeElement as HTMLElement;
      const firstRow = el.querySelector('[data-testid="standings-row"]');
      const cells = firstRow?.querySelectorAll('td');
      expect(cells?.length).toBe(10);
    });

    it('should render club logos in standings', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelectorAll('[data-testid="standings-club-logo"]').length).toBeGreaterThan(0);
    });

    it('should render logo placeholders when no logo', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelectorAll('[data-testid="standings-club-logo-placeholder"]').length).toBeGreaterThan(0);
    });

    it('should show positive goal difference with plus sign', () => {
      const el = fixture.nativeElement as HTMLElement;
      const rows = el.querySelectorAll('[data-testid="standings-row"]');
      const lastCell = rows[0].querySelectorAll('td')[9];
      expect(lastCell.textContent?.trim()).toBe('+6');
    });

    it('should show empty state when no standings', () => {
      fixtureServiceMock.getStandings.mockReturnValue(of([]));
      component.onDivisionChange(206752);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid="standings-empty"]')).toBeTruthy();
    });

    it('should show error when standings fail to load', () => {
      fixtureServiceMock.getStandings.mockReturnValue(throwError(() => new Error('Network error')));
      component.onDivisionChange(206752);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid="standings-error"]')).toBeTruthy();
    });

    it('should show loading while standings are loading', () => {
      fixtureServiceMock.getStandings.mockReturnValue(NEVER);
      component.onDivisionChange(206752);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid="standings-loading"]')).toBeTruthy();
    });
  });

  describe('formatMatchDate', () => {
    it('should format date string', () => {
      const result = component.formatMatchDate('2026-06-06T13:30:00Z');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
  });
});
