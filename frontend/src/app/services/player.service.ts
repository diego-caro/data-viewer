import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Category, CategoriesResponse, PlayersResponse } from '../models/player.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiBaseUrl;

  getCategories(): Observable<Category[]> {
    return this.http.get<CategoriesResponse>(`${this.apiUrl}/categories`).pipe(
      map((response) => response.data),
      catchError((error: HttpErrorResponse) => throwError(() => error)),
    );
  }

  getPlayersByCategory(categoryId: string): Observable<PlayersResponse> {
    return this.http
      .get<PlayersResponse>(`${this.apiUrl}/players?categoryId=${categoryId}`)
      .pipe(
        catchError((error: HttpErrorResponse) => throwError(() => error)),
      );
  }
}
