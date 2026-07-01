import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  FixtureMatch,
  FixtureClub,
  FixtureDivision,
  StandingsEntry,
  FixtureMatchesResponse,
  FixtureClubsResponse,
  FixtureDivisionsResponse,
  FixtureStandingsResponse,
  FixtureInstance,
  FixtureInstancesResponse,
  FixtureRound,
  FixtureResponse,
} from '../models/fixture.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FixtureService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiBaseUrl;

  getDivisions(): Observable<FixtureDivision[]> {
    return this.http.get<FixtureDivisionsResponse>(`${this.apiUrl}/fixture/divisions`).pipe(
      map((response) => response.data),
      catchError((error: HttpErrorResponse) => throwError(() => error)),
    );
  }

  getMatches(fixtureId: number): Observable<FixtureMatch[]> {
    return this.http.get<FixtureMatchesResponse>(`${this.apiUrl}/fixture/matches?fixtureId=${fixtureId}`).pipe(
      map((response) => response.data),
      catchError((error: HttpErrorResponse) => throwError(() => error)),
    );
  }

  getClubs(fixtureId: number): Observable<FixtureClub[]> {
    return this.http.get<FixtureClubsResponse>(`${this.apiUrl}/fixture/clubs?fixtureId=${fixtureId}`).pipe(
      map((response) => response.data),
      catchError((error: HttpErrorResponse) => throwError(() => error)),
    );
  }

  getStandings(fixtureId: number): Observable<StandingsEntry[]> {
    return this.http.get<FixtureStandingsResponse>(`${this.apiUrl}/fixture/standings?fixtureId=${fixtureId}`).pipe(
      map((response) => response.data),
      catchError((error: HttpErrorResponse) => throwError(() => error)),
    );
  }

  getInstances(fixtureId: number): Observable<FixtureInstance[]> {
    return this.http.get<FixtureInstancesResponse>(`${this.apiUrl}/fixture/instances?fixtureId=${fixtureId}`).pipe(
      map((response) => response.data),
      catchError((error: HttpErrorResponse) => throwError(() => error)),
    );
  }

  getFixtures(fixtureId: number): Observable<FixtureRound[]> {
    return this.http.get<FixtureResponse>(`${this.apiUrl}/fixture/fixtures?fixtureId=${fixtureId}`).pipe(
      map((response) => response.data),
      catchError((error: HttpErrorResponse) => throwError(() => error)),
    );
  }
}
