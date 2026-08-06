import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-worker-dashboard',
  standalone: true,
  template: `
    <div class="min-h-screen bg-cream flex flex-col items-center justify-center gap-6 font-body">
      <h1 class="font-display text-4xl text-espresso">Hi Worker 👋</h1>
      <button
        (click)="logout()"
        class="bg-espresso text-cream text-sm font-medium rounded-xl px-6 py-3
               transition hover:bg-espresso-light active:scale-[0.99]"
      >
        Log out
      </button>
    </div>
  `
})
export class WorkerDashboardComponent {
  constructor(private auth: AuthService, private router: Router) {}

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
