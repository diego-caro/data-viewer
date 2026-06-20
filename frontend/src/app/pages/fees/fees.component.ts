import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FeeService } from '../../services/fee.service';
import { AuthService } from '../../services/auth.service';
import { FixtureService } from '../../services/fixture.service';
import { CategoryFee, PlayerFee } from '../../models/fee.model';
import { FixtureMatch } from '../../models/fixture.model';

@Component({
  selector: 'app-player-fees',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fees.component.html',
})
export class PlayerFeesComponent implements OnInit {
  private readonly feeService = inject(FeeService);
  private readonly authService = inject(AuthService);
  private readonly fixtureService = inject(FixtureService);
  private readonly destroyRef = inject(DestroyRef);

  categoryFee: CategoryFee | null = null;
  myFee: PlayerFee | null = null;
  loading = true;
  error: string | null = null;
  isCaptain = false;
  daysUntilMatch: number | null = null;

  paying = signal(false);
  payError = signal<string | null>(null);

  get showWarningBanner(): boolean {
    return !this.isCaptain
      && this.myFee?.status === 'pending'
      && this.daysUntilMatch !== null
      && this.daysUntilMatch <= 4;
  }

  ngOnInit(): void {
    const user = this.authService.user();
    this.isCaptain = user?.role === 'captain';

    const fees$ = this.feeService.getCurrentFees();
    const matches$ = this.fixtureService.getMatches().pipe(
      catchError(() => of([] as FixtureMatch[]))
    );

    forkJoin([fees$, matches$])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([fees, matches]) => {
          if (fees.length > 0 && user) {
            this.categoryFee = fees[0];
            this.myFee = fees[0].playerFees.find((pf) => pf.userId === user.id) ?? null;
          }

          const now = new Date();
          const upcomingMatches = matches
            .filter((m) => m.status === 'pending' && new Date(m.date) > now)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

          if (upcomingMatches.length > 0) {
            const nextMatchDate = new Date(upcomingMatches[0].date);
            this.daysUntilMatch = Math.ceil(
              (nextMatchDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );
          }

          this.loading = false;
        },
        error: () => {
          this.error = 'Unable to load fee data. Please try again later.';
          this.loading = false;
        },
      });
  }

  onPay(): void {
    this.paying.set(true);
    this.payError.set(null);

    this.feeService
      .payFee()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.paying.set(false);
          window.open(result.initPoint, '_blank');
        },
        error: () => {
          this.paying.set(false);
          this.payError.set('Payment could not be initiated. Please try again.');
        },
      });
  }
}
