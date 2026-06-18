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
import { Category } from '../../models/player.model';

Chart.register(DoughnutController, ArcElement, Tooltip);

export interface CategoryChartData {
  categoryName: string;
  activeCount: number;
  inactiveCount: number;
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
  private readonly destroyRef = inject(DestroyRef);
  private readonly el = inject(ElementRef);
  private readonly zone = inject(NgZone);
  private charts: Chart[] = [];
  private chartsRendered = false;

  categoryCharts: CategoryChartData[] = [];
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.playerService
      .getCategories()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((categories: Category[]) => {
          if (categories.length === 0) {
            return of([]);
          }
          return forkJoin(
            categories.map((cat) =>
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
  }

  ngAfterViewChecked(): void {
    if (this.chartsRendered || this.loading || this.error) {
      return;
    }
    const canvases = this.el.nativeElement.querySelectorAll('canvas[data-chart-index]') as NodeListOf<HTMLCanvasElement>;
    if (canvases.length === 0) {
      return;
    }
    this.chartsRendered = true;
    this.zone.runOutsideAngular(() => {
      canvases.forEach((canvas) => {
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
    });
  }

  ngOnDestroy(): void {
    this.charts.forEach((chart) => chart.destroy());
  }
}
