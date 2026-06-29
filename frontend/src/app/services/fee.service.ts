import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CategoryFee, CreateFeeRequest, PaymentPreferenceResult, PaymentType, PlayerFee } from '../models/fee.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FeeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiBaseUrl;

  getCurrentFees(): Observable<CategoryFee[]> {
    return this.http.get<{ data: CategoryFee[] }>(`${this.apiUrl}/payments`).pipe(
      map((response) => response.data),
      catchError((error: HttpErrorResponse) => throwError(() => error)),
    );
  }

  createFee(request: CreateFeeRequest): Observable<CategoryFee> {
    return this.http.post<{ fee: CategoryFee }>(`${this.apiUrl}/payments`, request).pipe(
      map((response) => response.fee),
      catchError((error: HttpErrorResponse) => throwError(() => error)),
    );
  }

  markPlayerPaid(playerFeeId: string): Observable<PlayerFee> {
    return this.http.post<{ playerFee: PlayerFee }>(`${this.apiUrl}/payments/mark-paid`, { playerFeeId }).pipe(
      map((response) => response.playerFee),
      catchError((error: HttpErrorResponse) => throwError(() => error)),
    );
  }

  payFee(type: PaymentType = 'match'): Observable<PaymentPreferenceResult> {
    return this.http.post<PaymentPreferenceResult>(`${this.apiUrl}/payments/pay`, { type }).pipe(
      catchError((error: HttpErrorResponse) => throwError(() => error)),
    );
  }

  payAll(): Observable<PaymentPreferenceResult> {
    return this.http.post<PaymentPreferenceResult>(`${this.apiUrl}/payments/pay`, { payAll: true }).pipe(
      catchError((error: HttpErrorResponse) => throwError(() => error)),
    );
  }

  verifyPayment(paymentId: string, playerFeeId: string): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${this.apiUrl}/payments/verify-payment`, {
      paymentId,
      playerFeeId,
    }).pipe(
      catchError((error: HttpErrorResponse) => throwError(() => error)),
    );
  }
}
