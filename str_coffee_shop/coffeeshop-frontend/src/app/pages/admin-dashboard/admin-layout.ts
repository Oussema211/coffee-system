import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css'
})
export class AdminLayoutComponent {
  username: string | null;

  navItems = [
    { label: 'Dashboard', icon: 'grid',    path: '/admin' },
    { label: 'Orders',    icon: 'receipt',  path: '/admin/orders' },
    { label: 'Menu',      icon: 'menu',     path: '/admin/menu' },
    { label: 'Workers',   icon: 'people',   path: '/admin/workers' },
    { label: 'Reports',   icon: 'chart',    path: '/admin/reports' },
  ];

  constructor(private auth: AuthService, private router: Router) {
    this.username = this.auth.getUsername();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
