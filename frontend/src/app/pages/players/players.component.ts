import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { PlayerService } from '../../services/player.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { Player, Category } from '../../models/player.model';

@Component({
  selector: 'app-players',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './players.component.html',
})
export class PlayersComponent implements OnInit {
  private readonly playerService = inject(PlayerService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  categories: Category[] = [];
  players: Player[] = [];
  selectedCategoryId = '';
  loading = true;
  error: string | null = null;
  isPlayer = false;
  isAdmin = false;

  editingPlayerId = signal<string | null>(null);
  editingNumber = signal<number | null>(null);
  savingNumber = signal(false);
  changingCaptain = signal(false);

  ngOnInit(): void {
    const user = this.authService.user();
    this.isPlayer = user?.role === 'player';
    this.isAdmin = user?.role === 'admin';

    this.playerService
      .getCategories()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((categories) => {
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
    this.editingPlayerId.set(null);

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

  startEditNumber(player: Player): void {
    this.editingPlayerId.set(player.id);
    this.editingNumber.set(player.number);
  }

  cancelEditNumber(): void {
    this.editingPlayerId.set(null);
    this.editingNumber.set(null);
  }

  saveNumber(player: Player): void {
    console.log('Saving number for player:', player);
    this.savingNumber.set(true);
    this.userService
      .updatePlayerNumber(player.id, this.editingNumber())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const idx = this.players.findIndex((p) => p.id === player.id);
          if (idx >= 0) {
            this.players[idx] = { ...this.players[idx], number: this.editingNumber() };
          }
          this.editingPlayerId.set(null);
          this.savingNumber.set(false);
        },
        error: () => {
          this.savingNumber.set(false);
        },
      });
  }

  onChangeCaptain(player: Player): void {
    if (player.role === 'captain') return;
    this.changingCaptain.set(true);

    this.userService
      .changeCaptain(this.selectedCategoryId, player.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.players = this.players.map((p) => {
            if (p.id === player.id) return { ...p, role: 'captain' as const };
            if (p.role === 'captain') return { ...p, role: 'player' as const };
            return p;
          });
          this.changingCaptain.set(false);
        },
        error: () => {
          this.changingCaptain.set(false);
        },
      });
  }
}
