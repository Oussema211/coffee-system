import { Component } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-worker-layout',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './worker-layout.html',
  styleUrl: './worker-layout.css'
})
export class WorkerLayoutComponent {
  username: string | null;

  constructor(private auth: AuthService, public router: Router) {
    this.username = this.auth.getUsername();
  }

  isSubPage(): boolean {
    const url = this.router.url.split('?')[0];
    return url !== '/worker' && url !== '/worker/';
  }

  goBack(): void {
    this.router.navigate(['/worker']);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
