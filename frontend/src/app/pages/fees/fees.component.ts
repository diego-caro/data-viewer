import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { FeeService } from '../../services/fee.service';
import { AuthService } from '../../services/auth.service';
import { FixtureService } from '../../services/fixture.service';
import { CategoryFee, PlayerFee } from '../../models/fee.model';
import { FixtureMatch } from '../../models/fixture.model';

@Component({
  selector: 'app-player-fees',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './fees.component.html',
})
export class PlayerFeesComponent implements OnInit {
  private readonly feeService = inject(FeeService);
  private readonly authService = inject(AuthService);
  private readonly fixtureService = inject(FixtureService);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  categoryFee: CategoryFee | null = null;
  myFee: PlayerFee | null = null;
  leagueFee: CategoryFee | null = null;
  myLeagueFee: PlayerFee | null = null;
  travelFee: CategoryFee | null = null;
  myTravelFee: PlayerFee | null = null;
  loading = true;
  error: string | null = null;
  isCaptain = false;
  daysUntilMatch: number | null = null;

  paying = signal(false);
  payingLeague = signal(false);
  payingTravel = signal(false);
  payingAll = signal(false);
  payError = signal<string | null>(null);
  paymentFlash = signal<{ type: 'success' | 'error' | 'pending'; message: string } | null>(null);

  get showMatchWarning(): boolean {
    return this.myFee?.status === 'pending' && this.daysUntilMatch !== null && this.daysUntilMatch <= 4;
  }

  get showLeagueWarning(): boolean {
    return this.myLeagueFee?.status === 'pending' && this.daysUntilMatch !== null && this.daysUntilMatch <= 4;
  }

  get showTravelWarning(): boolean {
    return this.myTravelFee?.status === 'pending' && this.daysUntilMatch !== null && this.daysUntilMatch <= 4;
  }

  get totalUnpaidAmount(): number {
    let total = 0;
    if (this.myFee?.status === 'pending' && this.categoryFee) total += this.categoryFee.perPlayerAmount;
    if (this.myLeagueFee?.status === 'pending' && this.leagueFee) total += this.leagueFee.perPlayerAmount;
    if (this.myTravelFee?.status === 'pending' && this.travelFee) total += this.travelFee.perPlayerAmount;
    return total;
  }

  get unpaidCount(): number {
    let count = 0;
    if (this.myFee?.status === 'pending') count++;
    if (this.myLeagueFee?.status === 'pending') count++;
    if (this.myTravelFee?.status === 'pending') count++;
    return count;
  }

  get hasFeeData(): boolean {
    return this.categoryFee !== null || this.leagueFee !== null || this.travelFee !== null;
  }

  ngOnInit(): void {
    const paymentParam = this.route.snapshot.queryParamMap.get('payment');
    const paymentId = this.route.snapshot.queryParamMap.get('collection_id') || this.route.snapshot.queryParamMap.get('payment_id');
    const externalRef = this.route.snapshot.queryParamMap.get('external_reference');

    if (paymentParam === 'success') {
      this.paymentFlash.set({ type: 'success', message: this.translate.instant('FEES.FLASH_SUCCESS') });
      if (paymentId && externalRef) {
        this.feeService
          .verifyPayment(paymentId, externalRef)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((result) => {
            if (result.status === 'paid' || result.status === 'already_paid') {
              if (this.myFee) {
                this.myFee = { ...this.myFee, status: 'paid', paidAt: new Date().toISOString() };
              }
              if (this.myLeagueFee) {
                this.myLeagueFee = { ...this.myLeagueFee, status: 'paid', paidAt: new Date().toISOString() };
              }
              if (this.myTravelFee) {
                this.myTravelFee = { ...this.myTravelFee, status: 'paid', paidAt: new Date().toISOString() };
              }
            }
          });
      }
    } else if (paymentParam === 'failure') {
      this.paymentFlash.set({ type: 'error', message: this.translate.instant('FEES.FLASH_FAILURE') });
    } else if (paymentParam === 'pending') {
      this.paymentFlash.set({ type: 'pending', message: this.translate.instant('FEES.FLASH_PENDING') });
    }

    const user = this.authService.user();
    this.isCaptain = user?.role === 'captain';

    const fees$ = this.feeService.getCurrentFees();
    const matches$ = this.fixtureService.getDivisions().pipe(
      switchMap((divisions) => (divisions.length > 0 ? this.fixtureService.getMatches(divisions[0].id) : of([] as FixtureMatch[]))),
      catchError(() => of([] as FixtureMatch[])),
    );

    forkJoin([fees$, matches$])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([fees, matches]) => {
          if (user) {
            const matchFee = fees.find((f) => f.type === 'match');
            const league = fees.find((f) => f.type === 'league');
            const travel = fees.find((f) => f.type === 'travel');

            if (matchFee) {
              this.categoryFee = matchFee;
              this.myFee = matchFee.playerFees.find((pf) => pf.userId === user.id) ?? null;
            }
            if (league) {
              this.leagueFee = league;
              this.myLeagueFee = league.playerFees.find((pf) => pf.userId === user.id) ?? null;
            }
            if (travel) {
              this.travelFee = travel;
              this.myTravelFee = travel.playerFees.find((pf) => pf.userId === user.id) ?? null;
            }
          }

          const now = new Date();
          const upcomingMatches = matches
            .filter((m) => m.status === 'pending' && new Date(m.date) > now)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

          if (upcomingMatches.length > 0) {
            const nextMatchDate = new Date(upcomingMatches[0].date);
            this.daysUntilMatch = Math.ceil((nextMatchDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          }

          this.loading = false;
        },
        error: () => {
          this.error = this.translate.instant('FEES.ERROR_LOAD');
          this.loading = false;
        },
      });
  }

  onPay(): void {
    this.paying.set(true);
    this.payError.set(null);

    this.feeService
      .payFee('match')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.paying.set(false);
          window.location.href = result.initPoint;
        },
        error: () => {
          this.paying.set(false);
          this.payError.set(this.translate.instant('FEES.ERROR_PAY'));
        },
      });
  }

  onPayLeague(): void {
    this.payingLeague.set(true);
    this.payError.set(null);

    this.feeService
      .payFee('league')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.payingLeague.set(false);
          window.location.href = result.initPoint;
        },
        error: () => {
          this.payingLeague.set(false);
          this.payError.set(this.translate.instant('FEES.ERROR_PAY'));
        },
      });
  }

  onPayTravel(): void {
    this.payingTravel.set(true);
    this.payError.set(null);

    this.feeService
      .payFee('travel')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.payingTravel.set(false);
          window.location.href = result.initPoint;
        },
        error: () => {
          this.payingTravel.set(false);
          this.payError.set(this.translate.instant('FEES.ERROR_PAY'));
        },
      });
  }

  onPayAll(): void {
    this.payingAll.set(true);
    this.payError.set(null);

    this.feeService
      .payAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.payingAll.set(false);
          window.location.href = result.initPoint;
        },
        error: () => {
          this.payingAll.set(false);
          this.payError.set(this.translate.instant('FEES.ERROR_PAY'));
        },
      });
  }
}
