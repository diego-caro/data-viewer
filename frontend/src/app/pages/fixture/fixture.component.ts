import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { FixtureService } from '../../services/fixture.service';
import { FixtureMatch, FixtureRound } from '../../models/fixture.model';

@Component({
  selector: 'app-fixture',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fixture.component.html',
})
export class FixtureComponent implements OnInit {
  private readonly fixtureService = inject(FixtureService);
  private readonly destroyRef = inject(DestroyRef);

  rounds: FixtureRound[] = [];
  clubLogos = new Map<number, string | null>();
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    forkJoin({
      matches: this.fixtureService.getMatches(),
      clubs: this.fixtureService.getClubs(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ matches, clubs }) => {
          clubs.forEach((club) => this.clubLogos.set(club.id, club.logo));
          this.rounds = this.groupByRound(matches);
          this.loading = false;
        },
        error: (err: Error) => {
          this.error = err.message || 'Failed to load fixture';
          this.loading = false;
        },
      });
  }

  getClubLogo(clubId: number): string | null {
    return this.clubLogos.get(clubId) ?? null;
  }

  formatMatchDate(dateStr: string): string {
    const date = new Date(dateStr);
    const isDateOnly = dateStr.includes('T03:00:00Z');

    if (isDateOnly) {
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'America/Argentina/Buenos_Aires',
      });
    }

    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Argentina/Buenos_Aires',
    });
  }

  private groupByRound(matches: FixtureMatch[]): FixtureRound[] {
    const roundMap = new Map<number, FixtureMatch[]>();

    matches.forEach((match) => {
      const existing = roundMap.get(match.round) ?? [];
      existing.push(match);
      roundMap.set(match.round, existing);
    });

    return Array.from(roundMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([number, roundMatches]) => ({ number, matches: roundMatches }));
  }
}
