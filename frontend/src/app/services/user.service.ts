import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UserProfile } from '../models/user.model';
import { environment } from '../../environments/environment';

export interface CreateUserRequest {
  email: string;
  password: string;
  role: 'admin' | 'player' | 'captain';
  firstName: string;
  lastName: string;
  categoryId: string | null;
  playerNumber?: number | null;
}

export interface UpdateUserRequest {
  email: string;
  role: 'admin' | 'player' | 'captain';
  firstName: string;
  lastName: string;
  categoryId: string | null;
  password?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiBaseUrl;

  getUsers(): Observable<{ data: UserProfile[] }> {
    return this.http.get<{ data: UserProfile[] }>(`${this.apiUrl}/users`).pipe(
      catchError((error: HttpErrorResponse) => throwError(() => error)),
    );
  }

  createUser(request: CreateUserRequest): Observable<{ user: UserProfile }> {
    return this.http.post<{ user: UserProfile }>(`${this.apiUrl}/users`, request).pipe(
      catchError((error: HttpErrorResponse) => throwError(() => error)),
    );
  }

  updatePlayerNumber(userId: string, playerNumber: number | null): Observable<{ user: UserProfile }> {
    return this.http.patch<{ user: UserProfile }>(`${this.apiUrl}/users/${userId}/number`, { playerNumber }).pipe(
      catchError((error: HttpErrorResponse) => throwError(() => error)),
    );
  }

  changeCaptain(categoryId: string, userId: string): Observable<{ newCaptain: UserProfile; oldCaptain: UserProfile | null }> {
    return this.http.put<{ newCaptain: UserProfile; oldCaptain: UserProfile | null }>(
      `${this.apiUrl}/categories/${categoryId}/captain`, { userId }
    ).pipe(
      catchError((error: HttpErrorResponse) => throwError(() => error)),
    );
  }

  updateUser(id: string, request: UpdateUserRequest): Observable<{ user: UserProfile }> {
    return this.http.put<{ user: UserProfile }>(`${this.apiUrl}/users/${id}`, request).pipe(
      catchError((error: HttpErrorResponse) => throwError(() => error)),
    );
  }

  deleteUser(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/users/${id}`).pipe(
      catchError((error: HttpErrorResponse) => throwError(() => error)),
    );
  }
}
