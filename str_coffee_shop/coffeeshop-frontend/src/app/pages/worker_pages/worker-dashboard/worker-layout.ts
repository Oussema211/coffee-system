import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-worker-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './worker-layout.html',
  styleUrl: './worker-layout.css'
})
export class WorkerLayoutComponent {
  username: string | null;

  constructor(private auth: AuthService, private router: Router) {
    this.username = this.auth.getUsername();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
