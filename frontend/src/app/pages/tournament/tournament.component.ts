import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { FixtureService } from '../../services/fixture.service';
import { FixtureRound, FixtureDivision, StandingsEntry } from '../../models/fixture.model';
import { environment } from '../../../environments/environment';

type ActiveTab = 'fixture' | 'standings';

@Component({
  selector: 'app-tournament',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './tournament.component.html',
})
export class TournamentComponent implements OnInit {
  private readonly fixtureService = inject(FixtureService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  divisions: FixtureDivision[] = [];
  selectedDivisionId = signal<number | null>(null);
  activeTab = signal<ActiveTab>('fixture');

  rounds: FixtureRound[] = [];
  standings: StandingsEntry[] = [];

  loadingDivisions = true;
  loadingContent = false;
  loadingStandings = false;
  error: string | null = null;
  standingsError: string | null = null;

  ngOnInit(): void {
    this.fixtureService
      .getDivisions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (divisions) => {
          if (divisions.length === 0) {
            this.loadingDivisions = false;
            return;
          }
          this.loadCategories(divisions);
        },
        error: () => {
          this.error = this.translate.instant('FIXTURE.ERROR_DIVISIONS');
          this.loadingDivisions = false;
        },
      });
  }

  onDivisionChange(divisionId: number): void {
    this.selectedDivisionId.set(divisionId);
    this.error = null;
    this.standingsError = null;
    this.loadFixtureData(divisionId);
    this.loadStandings(divisionId);
  }

  setActiveTab(tab: ActiveTab): void {
    this.activeTab.set(tab);
  }

  formatMatchDate(dateStr: string): string {
    const date = new Date(dateStr);
    const lang = this.translate.getCurrentLang() || 'es';
    const locale = lang === 'es' ? 'es-AR' : 'en-GB';

    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'America/Argentina/Buenos_Aires',
    });
  }

  private loadFixtureData(fixtureId: number): void {
    this.loadingContent = true;
    this.error = null;

    
      this.fixtureService.getFixtures(fixtureId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (matches) => {
          this.rounds = matches;
          this.loadingContent = false;
        },
        error: () => {
          this.error = this.translate.instant('FIXTURE.ERROR_FIXTURE');
          this.loadingContent = false;
        },
      });
  }

  private loadStandings(fixtureId: number): void {
    this.loadingStandings = true;
    this.standingsError = null;

    this.fixtureService
      .getStandings(fixtureId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (standings) => {
          this.standings = standings;
          this.loadingStandings = false;
        },
        error: () => {
          this.standingsError = this.translate.instant('FIXTURE.ERROR_STANDINGS');
          this.loadingStandings = false;
        },
      });
  }

  private loadCategories(divisions: FixtureDivision[]): void {
    const standingsRequests = divisions.map((division) =>
      this.fixtureService.getStandings(division.id).pipe(
        map((standings) => ({ division, standings })),
        catchError(() => of({ division, standings: [] as StandingsEntry[] })),
      ),
    );

    forkJoin(standingsRequests)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (results) => {
          this.divisions = results
            .filter(({ standings }) => standings.some((entry) => entry.clubName.includes(environment.clubName)))
            .map(({ division }) => division);

          this.loadingDivisions = false;

          if (this.divisions.length > 0) {
            this.selectedDivisionId.set(this.divisions[0].id);
            this.loadFixtureData(this.divisions[0].id);
            this.loadStandings(this.divisions[0].id);
          }
        },
        error: () => {
          this.error = this.translate.instant('FIXTURE.ERROR_DIVISIONS');
          this.loadingDivisions = false;
        },
      });
  }
}
