import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserService, CreateUserRequest, UpdateUserRequest } from '../../../services/user.service';
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
  editingUser = signal<UserProfile | null>(null);
  deletingUser = signal<UserProfile | null>(null);

  formData: CreateUserRequest = {
    email: '',
    password: '',
    role: 'player',
    firstName: '',
    lastName: '',
    categoryId: null,
    playerNumber: null,
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
    this.editingUser.set(null);
    this.formData = {
      email: '',
      password: '',
      role: 'player',
      firstName: '',
      lastName: '',
      categoryId: null,
      playerNumber: null,
    };
    this.formError.set(null);
    this.showForm.set(true);
  }

  openEditForm(user: UserProfile): void {
    this.editingUser.set(user);
    this.formData = {
      email: user.email,
      password: '',
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      categoryId: user.categoryId,
    };
    this.formError.set(null);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.formError.set(null);
    this.editingUser.set(null);
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
    if ((request.role === 'player' || request.role === 'captain') && !request.categoryId && this.categories.length > 0) {
      request.categoryId = this.categories[0].id;
    }

    const editing = this.editingUser();
    if (editing) {
      const updateRequest: UpdateUserRequest = {
        email: request.email,
        role: request.role,
        firstName: request.firstName,
        lastName: request.lastName,
        categoryId: request.categoryId,
      };
      if (request.password) {
        updateRequest.password = request.password;
      }

      this.userService
        .updateUser(editing.id, updateRequest)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            this.users = this.users.map((u) => (u.id === editing.id ? response.user : u));
            this.formLoading.set(false);
            this.showForm.set(false);
            this.editingUser.set(null);
          },
          error: (err: HttpErrorResponse) => {
            this.formLoading.set(false);
            this.handleFormError(err);
          },
        });
    } else {
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
            this.handleFormError(err);
          },
        });
    }
  }

  confirmDeleteUser(user: UserProfile): void {
    this.deletingUser.set(user);
  }

  cancelDelete(): void {
    this.deletingUser.set(null);
  }

  onConfirmDelete(): void {
    const user = this.deletingUser();
    if (!user) return;

    this.userService
      .deleteUser(user.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.users = this.users.filter((u) => u.id !== user.id);
          this.deletingUser.set(null);
        },
        error: () => {
          this.deletingUser.set(null);
        },
      });
  }

  private handleFormError(err: HttpErrorResponse): void {
    const message = err.error?.error;
    if (err.status === 409) {
      this.formError.set('Email already exists');
    } else if (message) {
      this.formError.set(message);
    } else {
      this.formError.set('Failed to save user. Please try again.');
    }
  }

  getCategoryName(categoryId: string | null): string {
    if (!categoryId) return '-';
    return this.categories.find((c) => c.id === categoryId)?.name ?? categoryId;
  }
}
