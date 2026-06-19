import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { PlayerService } from '../../services/player.service';
import { AuthService } from '../../services/auth.service';
import { Player, Category } from '../../models/player.model';

@Component({
  selector: 'app-players',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './players.component.html',
})
export class PlayersComponent implements OnInit {
  private readonly playerService = inject(PlayerService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  categories: Category[] = [];
  players: Player[] = [];
  selectedCategoryId = '';
  loading = true;
  error: string | null = null;
  isPlayer = false;

  ngOnInit(): void {
    this.playerService
      .getCategories()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((categories) => {
          const user = this.authService.user();
          this.isPlayer = user?.role === 'player';
          if (this.isPlayer && user?.categoryId) {
            this.categories = categories.filter((c) => c.id === user.categoryId);
          } else {
            this.categories = categories;
          }
          if (this.categories.length > 0) {
            this.selectedCategoryId = this.categories[0].id;
            return this.playerService.getPlayersByCategory(this.categories[0].id);
          }
          this.loading = false;
          return of(null);
        }),
      )
      .subscribe({
        next: (response) => {
          if (response) {
            this.players = response.data;
          }
          this.loading = false;
        },
        error: (err: Error) => {
          this.error = err.message || 'Failed to load data';
          this.loading = false;
        },
      });
  }

  onCategoryChange(categoryId: string): void {
    this.selectedCategoryId = categoryId;
    this.error = null;

    this.playerService
      .getPlayersByCategory(categoryId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.players = response.data;
        },
        error: (err: Error) => {
          this.error = err.message || 'Failed to load players';
        },
      });
  }
}
