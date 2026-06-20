import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FeeService } from './fee.service';
import { CategoryFee, PaymentPreferenceResult, PlayerFee } from '../models/fee.model';
import { environment } from '../../environments/environment';

describe('FeeService', () => {
  let service: FeeService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(FeeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCurrentFees', () => {
    it('should fetch current fees', () => {
      const mockFees: CategoryFee[] = [
        {
          id: 'fee-1', categoryId: 'cat-1', categoryName: 'Sub 14',
          totalAmount: 3000, availablePlayers: 10, perPlayerAmount: 300,
          weekStartDate: '2026-06-15', createdBy: 'admin-1',
          createdAt: '2026-06-15T00:00:00Z', playerFees: [],
          paidCount: 0, unpaidCount: 0,
        },
      ];

      service.getCurrentFees().subscribe((fees) => {
        expect(fees).toEqual(mockFees);
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/fees`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockFees });
    });

    it('should handle error when fetching fees', () => {
      service.getCurrentFees().subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
        },
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/fees`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('createFee', () => {
    it('should create a fee configuration', () => {
      const mockFee: CategoryFee = {
        id: 'fee-1', categoryId: 'cat-1', categoryName: 'Sub 14',
        totalAmount: 3000, availablePlayers: 10, perPlayerAmount: 300,
        weekStartDate: '2026-06-15', createdBy: 'admin-1',
        createdAt: '2026-06-15T00:00:00Z', playerFees: [],
        paidCount: 0, unpaidCount: 0,
      };

      service.createFee({ categoryId: 'cat-1', totalAmount: 3000, availablePlayers: 10 }).subscribe((fee) => {
        expect(fee).toEqual(mockFee);
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/fees`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ categoryId: 'cat-1', totalAmount: 3000, availablePlayers: 10 });
      req.flush({ fee: mockFee });
    });
  });

  describe('markPlayerPaid', () => {
    it('should mark a player fee as paid', () => {
      const mockPlayerFee: PlayerFee = {
        id: 'pf-1', categoryFeeId: 'fee-1', userId: 'u1',
        playerName: 'One, Player', status: 'paid', paidAt: '2026-06-16T10:00:00Z',
      };

      service.markPlayerPaid('pf-1').subscribe((result) => {
        expect(result).toEqual(mockPlayerFee);
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/fees/mark-paid`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ playerFeeId: 'pf-1' });
      req.flush({ playerFee: mockPlayerFee });
    });
  });

  describe('payFee', () => {
    it('should create a payment preference', () => {
      const mockResult: PaymentPreferenceResult = {
        preferenceId: 'pref-123',
        initPoint: 'https://www.mercadopago.com/checkout/v1/redirect?pref_id=pref-123',
        sandboxInitPoint: 'https://sandbox.mercadopago.com/checkout/v1/redirect?pref_id=pref-123',
      };

      service.payFee().subscribe((result) => {
        expect(result).toEqual(mockResult);
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/fees/pay`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResult);
    });

    it('should handle error when payment creation fails', () => {
      service.payFee().subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
        },
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/fees/pay`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
