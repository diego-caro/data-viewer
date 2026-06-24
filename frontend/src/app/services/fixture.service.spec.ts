import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { FixtureService } from './fixture.service';
import {
  FixtureMatch,
  FixtureClub,
  FixtureDivision,
  StandingsEntry,
} from '../models/fixture.model';
import { environment } from '../../environments/environment';

describe('FixtureService', () => {
  let service: FixtureService;
  let httpMock: HttpTestingController;

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
  ];

  const MOCK_CLUBS: FixtureClub[] = [
    { id: 3, name: 'Bigornia Club', logo: 'base64data1' },
    { id: 5, name: 'Club Empleados de Comercio', logo: null },
  ];

  const MOCK_DIVISIONS: FixtureDivision[] = [
    { id: 206754, name: 'Caballeros Primera' },
    { id: 206752, name: 'Mixto Sub 14 A' },
  ];

  const MOCK_STANDINGS: StandingsEntry[] = [
    {
      position: 1,
      clubId: 1,
      clubName: 'Patoruzú Rugby Club',
      clubLogo: 'base64logo1',
      points: 9,
      played: 3,
      won: 3,
      drawn: 0,
      lost: 0,
      goalsFor: 8,
      goalsAgainst: 2,
      goalDifference: 6,
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(FixtureService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getDivisions', () => {
    it('should fetch and return divisions', () => {
      service.getDivisions().subscribe((divisions) => {
        expect(divisions).toEqual(MOCK_DIVISIONS);
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/fixture/divisions`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: MOCK_DIVISIONS });
    });

    it('should return empty array when no divisions', () => {
      service.getDivisions().subscribe((divisions) => {
        expect(divisions).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/fixture/divisions`);
      req.flush({ data: [] });
    });

    it('should handle error when fetching divisions', () => {
      service.getDivisions().subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/fixture/divisions`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getMatches', () => {
    it('should fetch matches with fixtureId', () => {
      service.getMatches(206752).subscribe((matches) => {
        expect(matches).toEqual(MOCK_MATCHES);
      });

      const req = httpMock.expectOne(
        `${environment.apiBaseUrl}/fixture/matches?fixtureId=206752`
      );
      expect(req.request.method).toBe('GET');
      req.flush({ data: MOCK_MATCHES });
    });

    it('should return empty array when no matches', () => {
      service.getMatches(206752).subscribe((matches) => {
        expect(matches).toEqual([]);
      });

      const req = httpMock.expectOne(
        `${environment.apiBaseUrl}/fixture/matches?fixtureId=206752`
      );
      req.flush({ data: [] });
    });

    it('should handle error when fetching matches', () => {
      service.getMatches(206752).subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(
        `${environment.apiBaseUrl}/fixture/matches?fixtureId=206752`
      );
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getClubs', () => {
    it('should fetch clubs with fixtureId', () => {
      service.getClubs(206752).subscribe((clubs) => {
        expect(clubs).toEqual(MOCK_CLUBS);
      });

      const req = httpMock.expectOne(
        `${environment.apiBaseUrl}/fixture/clubs?fixtureId=206752`
      );
      expect(req.request.method).toBe('GET');
      req.flush({ data: MOCK_CLUBS });
    });

    it('should return empty array when no clubs', () => {
      service.getClubs(206752).subscribe((clubs) => {
        expect(clubs).toEqual([]);
      });

      const req = httpMock.expectOne(
        `${environment.apiBaseUrl}/fixture/clubs?fixtureId=206752`
      );
      req.flush({ data: [] });
    });

    it('should handle error when fetching clubs', () => {
      service.getClubs(206752).subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(
        `${environment.apiBaseUrl}/fixture/clubs?fixtureId=206752`
      );
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getStandings', () => {
    it('should fetch standings with fixtureId', () => {
      service.getStandings(206752).subscribe((standings) => {
        expect(standings).toEqual(MOCK_STANDINGS);
      });

      const req = httpMock.expectOne(
        `${environment.apiBaseUrl}/fixture/standings?fixtureId=206752`
      );
      expect(req.request.method).toBe('GET');
      req.flush({ data: MOCK_STANDINGS });
    });

    it('should return empty array when no standings', () => {
      service.getStandings(206752).subscribe((standings) => {
        expect(standings).toEqual([]);
      });

      const req = httpMock.expectOne(
        `${environment.apiBaseUrl}/fixture/standings?fixtureId=206752`
      );
      req.flush({ data: [] });
    });

    it('should handle error when fetching standings', () => {
      service.getStandings(206752).subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(
        `${environment.apiBaseUrl}/fixture/standings?fixtureId=206752`
      );
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
