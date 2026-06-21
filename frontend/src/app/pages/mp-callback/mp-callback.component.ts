import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MpService } from '../../services/mp.service';

@Component({
  selector: 'app-mp-callback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mp-callback.component.html',
})
export class MpCallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  private readonly mpService = inject(MpService);

  status = signal<'loading' | 'success' | 'error'>('loading');
  message = signal('Connecting your Mercado Pago account...');

  ngOnInit(): void {
    const code = this.route.snapshot.queryParamMap.get('code');

    if (!code) {
      this.status.set('error');
      this.message.set('Authorization was cancelled or failed.');
      return;
    }

    this.mpService.handleCallback(code).subscribe({
      next: (response) => {
        this.status.set('success');
        this.message.set(response.message);
        setTimeout(() => this.router.navigate(['/fees']), 2000);
      },
      error: () => {
        this.status.set('error');
        this.message.set('Failed to connect Mercado Pago. Please try again.');
      },
    });
  }
}
