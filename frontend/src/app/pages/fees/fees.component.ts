import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FeeService } from '../../services/fee.service';
import { AuthService } from '../../services/auth.service';
import { CategoryFee, PlayerFee } from '../../models/fee.model';

@Component({
  selector: 'app-player-fees',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fees.component.html',
})
export class PlayerFeesComponent implements OnInit {
  private readonly feeService = inject(FeeService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  categoryFee: CategoryFee | null = null;
  myFee: PlayerFee | null = null;
  loading = true;
  error: string | null = null;

  paying = signal(false);
  payError = signal<string | null>(null);

  ngOnInit(): void {
    this.feeService
      .getCurrentFees()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (fees) => {
          const user = this.authService.user();
          if (fees.length > 0 && user) {
            this.categoryFee = fees[0];
            this.myFee = fees[0].playerFees.find((pf) => pf.userId === user.id) ?? null;
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
