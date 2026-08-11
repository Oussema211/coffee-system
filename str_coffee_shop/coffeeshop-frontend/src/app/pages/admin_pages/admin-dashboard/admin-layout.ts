import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { Router } from '@angular/router';

import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { LanguageSwitcherComponent } from '../../../core/components/language-switcher/language-switcher';
import { ConfirmDialogComponent } from '../../../core/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe, LanguageSwitcherComponent, ConfirmDialogComponent],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css'
})
export class AdminLayoutComponent {
  username: string | null;
  showLogoutDialog = false;

  navItems = [
    { label: 'Dashboard', icon: 'grid',    path: '/admin' },
    { label: 'Orders',    icon: 'receipt',  path: '/admin/orders' },
    { label: 'Menu',      icon: 'menu',     path: '/admin/menu' },
    { label: 'Workers',   icon: 'people',   path: '/admin/workers' },
    { label: 'Tables',    icon: 'tables',   path: '/admin/tables' },
    { label: 'Reports',   icon: 'chart',    path: '/admin/reports' },
  ];

  constructor(private auth: AuthService, private router: Router) {
    this.username = this.auth.getUsername();
  }

  logout(): void {
    this.showLogoutDialog = true;
  }

  confirmLogout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  closeLogoutDialog(): void {
    this.showLogoutDialog = false;
  }
}
