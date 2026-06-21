import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MpService } from './mp.service';
import { environment } from '../../environments/environment';

describe('MpService', () => {
  let service: MpService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MpService],
    });
    service = TestBed.inject(MpService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getStatus', () => {
    it('should call GET /mp/status', () => {
      service.getStatus().subscribe((status) => {
        expect(status.connected).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/mp/status`);
      expect(req.request.method).toBe('GET');
      req.flush({ connected: true, updatedAt: '2026-06-21T00:00:00Z' });
    });

    it('should propagate error', () => {
      service.getStatus().subscribe({
        error: (err) => {
          expect(err.status).toBe(403);
        },
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/mp/status`);
      req.flush({ error: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('getAuthUrl', () => {
    it('should call GET /mp/auth-url', () => {
      service.getAuthUrl().subscribe((response) => {
        expect(response.url).toContain('mercadopago');
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/mp/auth-url`);
      expect(req.request.method).toBe('GET');
      req.flush({ url: 'https://auth.mercadopago.com/authorization?client_id=123' });
    });
  });

  describe('handleCallback', () => {
    it('should call GET /mp/callback with code param', () => {
      service.handleCallback('TG-auth-code').subscribe((response) => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(
        (r) => r.url === `${environment.apiBaseUrl}/mp/callback` && r.params.get('code') === 'TG-auth-code'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, message: 'Mercado Pago connected successfully' });
    });

    it('should propagate error', () => {
      service.handleCallback('invalid-code').subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(
        (r) => r.url === `${environment.apiBaseUrl}/mp/callback`
      );
      req.flush({ error: 'Failed' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
