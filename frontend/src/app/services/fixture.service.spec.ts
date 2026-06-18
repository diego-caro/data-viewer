import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { FixtureService } from './fixture.service';
import { FixtureMatch, FixtureClub } from '../models/fixture.model';
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
    { id: 3, name: 'Bigornia Club', logo: 'base64data1' },
    { id: 5, name: 'Club Empleados de Comercio', logo: null },
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

  describe('getMatches', () => {
    it('should fetch and return matches', () => {
      service.getMatches().subscribe((matches) => {
        expect(matches).toEqual(MOCK_MATCHES);
        expect(matches).toHaveLength(2);
      });

      const req = httpMock.expectOne(
        `${environment.apiBaseUrl}/fixture/matches`
      );
      expect(req.request.method).toBe('GET');
      req.flush({ data: MOCK_MATCHES });
    });

    it('should return empty array when no matches', () => {
      service.getMatches().subscribe((matches) => {
        expect(matches).toEqual([]);
      });

      const req = httpMock.expectOne(
        `${environment.apiBaseUrl}/fixture/matches`
      );
      req.flush({ data: [] });
    });

    it('should handle error when fetching matches', () => {
      service.getMatches().subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(
        `${environment.apiBaseUrl}/fixture/matches`
      );
      req.flush('Server Error', {
        status: 500,
        statusText: 'Internal Server Error',
      });
    });
  });

  describe('getClubs', () => {
    it('should fetch and return clubs', () => {
      service.getClubs().subscribe((clubs) => {
        expect(clubs).toEqual(MOCK_CLUBS);
        expect(clubs).toHaveLength(2);
      });

      const req = httpMock.expectOne(
        `${environment.apiBaseUrl}/fixture/clubs`
      );
      expect(req.request.method).toBe('GET');
      req.flush({ data: MOCK_CLUBS });
    });

    it('should return empty array when no clubs', () => {
      service.getClubs().subscribe((clubs) => {
        expect(clubs).toEqual([]);
      });

      const req = httpMock.expectOne(
        `${environment.apiBaseUrl}/fixture/clubs`
      );
      req.flush({ data: [] });
    });

    it('should handle error when fetching clubs', () => {
      service.getClubs().subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(
        `${environment.apiBaseUrl}/fixture/clubs`
      );
      req.flush('Server Error', {
        status: 500,
        statusText: 'Internal Server Error',
      });
    });
  });
});
