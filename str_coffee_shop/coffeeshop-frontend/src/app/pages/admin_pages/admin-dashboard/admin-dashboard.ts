import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { DashboardService, RecentOrder } from '../../../core/dashboard.service';

import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { LoadingComponent } from '../../../core/components/loading/loading';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe, LoadingComponent],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboardComponent implements OnInit {
  username: string | null;
  loading = true;
  errorMessage = '';

  stats = [
    { label: "Today's revenue", value: '—', sub: 'Loading…', trend: 'neutral' },
    { label: 'Orders today', value: '—', sub: 'Loading…', trend: 'neutral' },
    { label: 'Active workers', value: '—', sub: 'Loading…', trend: 'neutral' },
    { label: 'Menu items', value: '—', sub: 'Loading…', trend: 'neutral' },
  ];

  recentOrders: RecentOrder[] = [];

  constructor(private auth: AuthService, private dashboardService: DashboardService) {
    this.username = this.auth.getUsername();
  }

  ngOnInit(): void {
    this.dashboardService.getDashboard().subscribe({
      next: (data) => {
        this.stats = [
          { label: "Today's revenue", value: `${Number(data.todaysRevenue).toFixed(2)} TND`, sub: 'excluding cancelled orders', trend: 'up' },
          { label: 'Orders today', value: String(data.ordersToday), sub: `${data.pendingOrders} pending`, trend: data.pendingOrders ? 'up' : 'neutral' },
          { label: 'Active workers', value: String(data.activeWorkers), sub: `of ${data.totalWorkers} staff`, trend: 'neutral' },
          { label: 'Menu items', value: String(data.menuItems), sub: `${data.unavailableMenuItems} hidden`, trend: 'neutral' },
        ];
        this.recentOrders = data.recentOrders;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load dashboard data. Please try again.';
        this.loading = false;
      }
    });
  }
}
