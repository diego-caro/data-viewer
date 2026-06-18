import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError, NEVER } from 'rxjs';
import { FixtureComponent } from './fixture.component';
import { FixtureService } from '../../services/fixture.service';
import { FixtureMatch, FixtureClub } from '../../models/fixture.model';

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
    id: 207520,
    status: 'completed',
    date: '2026-06-06T15:30:00Z',
    venue: 'Patoruzu',
    round: 1,
    homeTeam: { clubId: 1, clubName: 'Patoruzu Rugby Club' },
    awayTeam: { clubId: 12, clubName: 'Trelew R.C.' },
    score: { home: 2, away: 0 },
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
  { id: 1, name: 'Patoruzu Rugby Club', logo: 'base64logo1' },
  { id: 3, name: 'Bigornia Club', logo: 'base64logo3' },
  { id: 5, name: 'Club Empleados de Comercio', logo: null },
  { id: 12, name: 'Trelew R.C.', logo: 'base64logo12' },
];

describe('FixtureComponent', () => {
  let component: FixtureComponent;
  let fixture: ComponentFixture<FixtureComponent>;
  let fixtureServiceMock: jest.Mocked<FixtureService>;

  beforeEach(async () => {
    fixtureServiceMock = {
      getMatches: jest.fn().mockReturnValue(of(MOCK_MATCHES)),
      getClubs: jest.fn().mockReturnValue(of(MOCK_CLUBS)),
    } as unknown as jest.Mocked<FixtureService>;

    await TestBed.configureTestingModule({
      imports: [FixtureComponent],
      providers: [{ provide: FixtureService, useValue: fixtureServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(FixtureComponent);
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

    it('should hide loading after data loads', () => {
      fixture.detectChanges();
      expect(component.loading).toBe(false);
    });

    it('should render loading indicator in template', () => {
      fixtureServiceMock.getMatches.mockReturnValue(NEVER);
      fixtureServiceMock.getClubs.mockReturnValue(NEVER);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('[data-testid="loading-state"]')).toBeTruthy();
    });

    it('should hide loading indicator after data loads', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('[data-testid="loading-state"]')).toBeNull();
    });
  });

  describe('data fetching', () => {
    it('should fetch matches and clubs on init', () => {
      fixture.detectChanges();
      expect(fixtureServiceMock.getMatches).toHaveBeenCalledTimes(1);
      expect(fixtureServiceMock.getClubs).toHaveBeenCalledTimes(1);
    });

    it('should build club logo map from clubs data', () => {
      fixture.detectChanges();
      expect(component.clubLogos.get(3)).toBe('base64logo3');
      expect(component.clubLogos.get(5)).toBeNull();
    });
  });

  describe('grouping by round', () => {
    it('should group matches into rounds', () => {
      fixture.detectChanges();
      expect(component.rounds).toHaveLength(2);
    });

    it('should assign correct round numbers', () => {
      fixture.detectChanges();
      expect(component.rounds[0].number).toBe(1);
      expect(component.rounds[1].number).toBe(3);
    });

    it('should place matches in correct rounds', () => {
      fixture.detectChanges();
      expect(component.rounds[0].matches).toHaveLength(2);
      expect(component.rounds[1].matches).toHaveLength(1);
    });

    it('should sort rounds by number ascending', () => {
      fixture.detectChanges();
      for (let i = 1; i < component.rounds.length; i++) {
        expect(component.rounds[i].number).toBeGreaterThan(
          component.rounds[i - 1].number
        );
      }
    });
  });

  describe('completed matches', () => {
    it('should display score for completed matches', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const matchCards = compiled.querySelectorAll('[data-testid="match-card-completed"]');
      expect(matchCards.length).toBe(2);
    });

    it('should show home and away scores', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const scores = compiled.querySelectorAll('[data-testid="match-score"]');
      expect(scores[0]?.textContent?.trim()).toContain('2');
    });
  });

  describe('pending matches', () => {
    it('should display date for pending matches', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const matchCards = compiled.querySelectorAll('[data-testid="match-card-pending"]');
      expect(matchCards.length).toBe(1);
    });

    it('should show scheduled date instead of score', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const pendingDate = compiled.querySelector('[data-testid="match-date-pending"]');
      expect(pendingDate).toBeTruthy();
    });
  });

  describe('team logos', () => {
    it('should render logo for teams that have one', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const logos = compiled.querySelectorAll('[data-testid="team-logo"]');
      expect(logos.length).toBeGreaterThan(0);
    });

    it('should render placeholder for teams without logo', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const placeholders = compiled.querySelectorAll('[data-testid="team-logo-placeholder"]');
      expect(placeholders.length).toBeGreaterThan(0);
    });
  });

  describe('venue', () => {
    it('should display venue name on match cards', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const venues = compiled.querySelectorAll('[data-testid="match-venue"]');
      expect(venues.length).toBe(3);
      expect(venues[0]?.textContent).toContain('Bigornia');
    });
  });

  describe('team names', () => {
    it('should display home and away team names', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const teamNames = compiled.querySelectorAll('[data-testid="team-name"]');
      expect(teamNames.length).toBe(6);
      expect(teamNames[0]?.textContent).toContain('Bigornia Club');
    });
  });

  describe('empty state', () => {
    it('should show empty message when no matches', () => {
      fixtureServiceMock.getMatches.mockReturnValue(of([]));
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const emptyState = compiled.querySelector('[data-testid="empty-state"]');
      expect(emptyState).toBeTruthy();
    });
  });

  describe('error state', () => {
    it('should show error when matches fail to load', () => {
      fixtureServiceMock.getMatches.mockReturnValue(
        throwError(() => new Error('Network error'))
      );
      fixture.detectChanges();

      expect(component.error).toBeTruthy();
      const compiled = fixture.nativeElement as HTMLElement;
      const errorState = compiled.querySelector('[data-testid="error-state"]');
      expect(errorState).toBeTruthy();
    });

    it('should show error when clubs fail to load', () => {
      fixtureServiceMock.getClubs.mockReturnValue(
        throwError(() => new Error('Network error'))
      );
      fixture.detectChanges();

      expect(component.error).toBeTruthy();
    });

    it('should not show content when in error state', () => {
      fixtureServiceMock.getMatches.mockReturnValue(
        throwError(() => new Error('Network error'))
      );
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('[data-testid="fixture-content"]')).toBeNull();
    });
  });

  describe('getClubLogo helper', () => {
    it('should return logo for known club', () => {
      fixture.detectChanges();
      expect(component.getClubLogo(3)).toBe('base64logo3');
    });

    it('should return null for unknown club', () => {
      fixture.detectChanges();
      expect(component.getClubLogo(999)).toBeNull();
    });
  });

  describe('formatMatchDate helper', () => {
    it('should format date string', () => {
      const result = component.formatMatchDate('2026-06-06T13:30:00Z');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should show only date for midnight Argentina time (T03:00:00Z)', () => {
      const result = component.formatMatchDate('2026-06-20T03:00:00Z');
      expect(result).toBeTruthy();
      expect(result).not.toContain(':');
    });
  });
});
