import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PlayerService } from './player.service';
import { Category, Player } from '../models/player.model';
import { environment } from '../../environments/environment';

describe('PlayerService', () => {
  let service: PlayerService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(PlayerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCategories', () => {
    it('should fetch all categories', () => {
      const mockCategories: Category[] = [
        { id: 'cat-1', name: 'Mixto Sub 14 A' },
        { id: 'cat-2', name: 'Mixto Sub 14 B' },
      ];

      service.getCategories().subscribe((categories) => {
        expect(categories).toEqual(mockCategories);
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/categories`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockCategories });
    });

    it('should handle error when fetching categories', () => {
      service.getCategories().subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
        },
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/categories`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getPlayersByCategory', () => {
    it('should fetch players for a given category', () => {
      const mockCategory: Category = { id: 'cat-1', name: 'Mixto Sub 14 A' };
      const mockPlayers: Player[] = [
        { id: 'p-01', number: 1, firstName: 'Mateo', lastName: 'Alvarez', status: 'active', categoryId: 'cat-1' },
        { id: 'p-02', number: 2, firstName: 'Valentina', lastName: 'Bravo', status: 'active', categoryId: 'cat-1' },
      ];

      service.getPlayersByCategory('cat-1').subscribe((response) => {
        expect(response.data).toEqual(mockPlayers);
        expect(response.category).toEqual(mockCategory);
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/players?categoryId=cat-1`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockPlayers, category: mockCategory });
    });

    it('should handle error when fetching players', () => {
      service.getPlayersByCategory('cat-1').subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
        },
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/players?categoryId=cat-1`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });
});
