import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UserProfile } from '../models/user.model';
import { environment } from '../../environments/environment';

export interface CreateUserRequest {
  email: string;
  password: string;
  role: 'admin' | 'player';
  firstName: string;
  lastName: string;
  categoryId: string | null;
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
}
