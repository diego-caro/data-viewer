import {
  Component, OnInit, OnDestroy, AfterViewChecked,
  inject, DestroyRef, ElementRef, NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Chart, DoughnutController, ArcElement, Tooltip } from 'chart.js';
import { PlayerService } from '../../services/player.service';
import { AuthService } from '../../services/auth.service';
import { FeeService } from '../../services/fee.service';
import { Category } from '../../models/player.model';

Chart.register(DoughnutController, ArcElement, Tooltip);

export interface CategoryChartData {
  categoryName: string;
  activeCount: number;
  inactiveCount: number;
  isEmpty: boolean;
}

export interface FeeChartData {
  categoryName: string;
  paidCount: number;
  unpaidCount: number;
  isEmpty: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit, AfterViewChecked, OnDestroy {
  private readonly playerService = inject(PlayerService);
  private readonly authService = inject(AuthService);
  private readonly feeService = inject(FeeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly el = inject(ElementRef);
  private readonly zone = inject(NgZone);
  private charts: Chart[] = [];
  private chartsRendered = false;

  categoryCharts: CategoryChartData[] = [];
  feeCharts: FeeChartData[] = [];
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    const user = this.authService.user();

    this.playerService
      .getCategories()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((categories: Category[]) => {
          const filtered = user?.role === 'player' && user.categoryId
            ? categories.filter((c) => c.id === user.categoryId)
            : categories;
          if (filtered.length === 0) {
            return of([]);
          }
          return forkJoin(
            filtered.map((cat) =>
              this.playerService.getPlayersByCategory(cat.id)
            )
          );
        }),
      )
      .subscribe({
        next: (responses) => {
          this.categoryCharts = responses.map((response) => {
            const players = response.data;
            const categoryName = response.category?.name ?? 'Unknown';
            const activeCount = players.filter((p) => p.status === 'active').length;
            const inactiveCount = players.filter((p) => p.status === 'inactive').length;
            const isEmpty = players.length === 0;

            return { categoryName, activeCount, inactiveCount, isEmpty };
          });
          this.loading = false;
          this.chartsRendered = false;
        },
        error: () => {
          this.error = 'Unable to load dashboard data. Please try again later.';
          this.loading = false;
        },
      });

    if (user?.role === 'admin') {
      this.feeService
        .getCurrentFees()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (fees) => {
            this.feeCharts = fees.map((fee) => ({
              categoryName: fee.categoryName,
              paidCount: fee.paidCount,
              unpaidCount: fee.unpaidCount,
              isEmpty: fee.paidCount === 0 && fee.unpaidCount === 0,
            }));
            this.chartsRendered = false;
          },
        });
    }
  }

  ngAfterViewChecked(): void {
    if (this.chartsRendered || this.loading || this.error) {
      return;
    }
    const playerCanvases = this.el.nativeElement.querySelectorAll('canvas[data-chart-index]') as NodeListOf<HTMLCanvasElement>;
    const feeCanvases = this.el.nativeElement.querySelectorAll('canvas[data-fee-chart-index]') as NodeListOf<HTMLCanvasElement>;
    if (playerCanvases.length === 0 && feeCanvases.length === 0) {
      return;
    }
    this.chartsRendered = true;
    this.zone.runOutsideAngular(() => {
      playerCanvases.forEach((canvas) => {
        const index = Number(canvas.dataset['chartIndex']);
        const chartData = this.categoryCharts[index];
        if (!chartData || chartData.isEmpty) return;
        const chart = new Chart(canvas, {
          type: 'doughnut',
          data: {
            labels: ['Active', 'Inactive'],
            datasets: [{
              data: [chartData.activeCount, chartData.inactiveCount],
              backgroundColor: ['#22c55e', '#ef4444'],
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false } },
          },
        });
        this.charts.push(chart);
      });

      feeCanvases.forEach((canvas) => {
        const index = Number(canvas.dataset['feeChartIndex']);
        const chartData = this.feeCharts[index];
        if (!chartData || chartData.isEmpty) return;
        const chart = new Chart(canvas, {
          type: 'doughnut',
          data: {
            labels: ['Paid', 'Unpaid'],
            datasets: [{
              data: [chartData.paidCount, chartData.unpaidCount],
              backgroundColor: ['#22c55e', '#ef4444'],
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false } },
          },
        });
        this.charts.push(chart);
      });
    });
  }

  ngOnDestroy(): void {
    this.charts.forEach((chart) => chart.destroy());
  }
}
