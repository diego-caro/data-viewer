import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface MpStatus {
  connected: boolean;
  updatedAt?: string;
}

export interface MpAuthUrlResponse {
  url: string;
}

export interface MpCallbackResponse {
  success: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class MpService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiBaseUrl;

  getStatus(): Observable<MpStatus> {
    return this.http.get<MpStatus>(`${this.apiUrl}/mp/status`).pipe(
      catchError((error: HttpErrorResponse) => throwError(() => error)),
    );
  }

  getAuthUrl(): Observable<MpAuthUrlResponse> {
    return this.http.get<MpAuthUrlResponse>(`${this.apiUrl}/mp/auth-url`).pipe(
      catchError((error: HttpErrorResponse) => throwError(() => error)),
    );
  }

  handleCallback(code: string): Observable<MpCallbackResponse> {
    return this.http.get<MpCallbackResponse>(`${this.apiUrl}/mp/callback`, {
      params: { code },
    }).pipe(
      catchError((error: HttpErrorResponse) => throwError(() => error)),
    );
  }
}
