import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  FixtureMatch,
  FixtureClub,
  FixtureMatchesResponse,
  FixtureClubsResponse,
} from '../models/fixture.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FixtureService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiBaseUrl;

  getMatches(): Observable<FixtureMatch[]> {
    return this.http
      .get<FixtureMatchesResponse>(`${this.apiUrl}/fixture/matches`)
      .pipe(
        map((response) => response.data),
        catchError((error: HttpErrorResponse) => throwError(() => error)),
      );
  }

  getClubs(): Observable<FixtureClub[]> {
    return this.http
      .get<FixtureClubsResponse>(`${this.apiUrl}/fixture/clubs`)
      .pipe(
        map((response) => response.data),
        catchError((error: HttpErrorResponse) => throwError(() => error)),
      );
  }
}
