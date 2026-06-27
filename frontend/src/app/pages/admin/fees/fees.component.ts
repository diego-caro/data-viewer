import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { FeeService } from '../../../services/fee.service';
import { PlayerService } from '../../../services/player.service';
import { CategoryFee } from '../../../models/fee.model';
import { Category } from '../../../models/player.model';

@Component({
  selector: 'app-admin-fees',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './fees.component.html',
})
export class AdminFeesComponent implements OnInit {
  private readonly feeService = inject(FeeService);
  private readonly playerService = inject(PlayerService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  fees: CategoryFee[] = [];
  categories: Category[] = [];
  loading = true;
  error: string | null = null;

  showForm = signal(false);
  formLoading = signal(false);
  formError = signal<string | null>(null);

  formData = {
    categoryId: '',
    totalAmount: 0,
    availablePlayers: 0,
  };

  get unconfiguredCategories(): Category[] {
    const configuredIds = new Set(this.fees.map((f) => f.categoryId));
    return this.categories.filter((c) => !configuredIds.has(c.id));
  }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    forkJoin({
      fees: this.feeService.getCurrentFees(),
      categories: this.playerService.getCategories(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ fees, categories }) => {
          this.fees = fees;
          this.categories = categories;
          this.loading = false;
        },
        error: () => {
          this.error = this.translate.instant('ADMIN_FEES.ERROR_LOAD');
          this.loading = false;
        },
      });
  }

  openConfigForm(categoryId: string): void {
    const existing = this.fees.find((f) => f.categoryId === categoryId);
    this.formData = {
      categoryId,
      totalAmount: existing?.totalAmount ?? 0,
      availablePlayers: existing?.availablePlayers ?? 0,
    };
    this.formError.set(null);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.formError.set(null);
  }

  onSubmit(): void {
    this.formError.set(null);
    this.formLoading.set(true);

    this.feeService
      .createFee({
        categoryId: this.formData.categoryId,
        totalAmount: this.formData.totalAmount,
        availablePlayers: this.formData.availablePlayers,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.formLoading.set(false);
          this.showForm.set(false);
          this.reloadFees();
        },
        error: () => {
          this.formLoading.set(false);
          this.formError.set(this.translate.instant('ADMIN_FEES.ERROR_SAVE'));
        },
      });
  }

  onMarkPaid(playerFeeId: string): void {
    this.feeService
      .markPlayerPaid(playerFeeId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.reloadFees(),
      });
  }

  getCategoryName(categoryId: string): string {
    return this.categories.find((c) => c.id === categoryId)?.name ?? categoryId;
  }

  private reloadFees(): void {
    this.feeService
      .getCurrentFees()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (fees) => {
          this.fees = fees;
        },
      });
  }
}
