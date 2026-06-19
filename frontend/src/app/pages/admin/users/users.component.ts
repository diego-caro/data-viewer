import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserService, CreateUserRequest } from '../../../services/user.service';
import { PlayerService } from '../../../services/player.service';
import { UserProfile } from '../../../models/user.model';
import { Category } from '../../../models/player.model';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
})
export class AdminUsersComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly playerService = inject(PlayerService);
  private readonly destroyRef = inject(DestroyRef);

  users: UserProfile[] = [];
  categories: Category[] = [];
  loading = true;
  error: string | null = null;

  showForm = signal(false);
  formLoading = signal(false);
  formError = signal<string | null>(null);

  formData: CreateUserRequest = {
    email: '',
    password: '',
    role: 'player',
    firstName: '',
    lastName: '',
    categoryId: null,
  };

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.userService
      .getUsers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.users = response.data;
          this.loading = false;
        },
        error: () => {
          this.error = 'Unable to load users. Please try again later.';
          this.loading = false;
        },
      });

    this.playerService
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => {
          this.categories = categories;
        },
      });
  }

  openForm(): void {
    this.formData = {
      email: '',
      password: '',
      role: 'player',
      firstName: '',
      lastName: '',
      categoryId: null,
    };
    this.formError.set(null);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.formError.set(null);
  }

  onRoleChange(): void {
    if (this.formData.role === 'admin') {
      this.formData.categoryId = null;
    }
  }

  onSubmit(): void {
    this.formError.set(null);
    this.formLoading.set(true);

    const request = { ...this.formData };
    if (request.role === 'player' && !request.categoryId && this.categories.length > 0) {
      request.categoryId = this.categories[0].id;
    }

    this.userService
      .createUser(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.users = [...this.users, response.user];
          this.formLoading.set(false);
          this.showForm.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.formLoading.set(false);
          const message = err.error?.error;
          if (err.status === 409) {
            this.formError.set('Email already exists');
          } else if (message) {
            this.formError.set(message);
          } else {
            this.formError.set('Failed to create user. Please try again.');
          }
        },
      });
  }

  getCategoryName(categoryId: string | null): string {
    if (!categoryId) return '-';
    return this.categories.find((c) => c.id === categoryId)?.name ?? categoryId;
  }
}
