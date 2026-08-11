import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { DashboardService, RecentOrder } from '../../../core/dashboard.service';
import { TranslationService } from '../../../core/translation.service';

import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { LoadingComponent } from '../../../core/components/loading/loading';

interface StatTile {
  labelKey: string;
  value: string;
  subKey: string;
  subParams: Record<string, any>;
  trend: 'up' | 'neutral';
}

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

  stats: StatTile[] = [
    { labelKey: 'admin.dashboard.todaySales', value: '—', subKey: 'common.loading', subParams: {}, trend: 'neutral' },
    { labelKey: 'admin.dashboard.ordersToday', value: '—', subKey: 'common.loading', subParams: {}, trend: 'neutral' },
    { labelKey: 'admin.dashboard.activeWorkers', value: '—', subKey: 'common.loading', subParams: {}, trend: 'neutral' },
    { labelKey: 'admin.dashboard.tablesOccupied', value: '—', subKey: 'common.loading', subParams: {}, trend: 'neutral' },
  ];

  recentOrders: RecentOrder[] = [];

  constructor(
    private auth: AuthService,
    private dashboardService: DashboardService,
    private translate: TranslationService
  ) {
    this.username = this.auth.getUsername();
  }

  ngOnInit(): void {
    this.dashboardService.getDashboard().subscribe({
      next: (data) => {
        this.stats = [
          { labelKey: 'admin.dashboard.todaySales', value: `${Number(data.todaysRevenue).toFixed(2)} ${this.translate.translate('common.currency')}`, subKey: 'admin.dashboard.todaySalesSub', subParams: {}, trend: 'up' },
          { labelKey: 'admin.dashboard.ordersToday', value: String(data.ordersToday), subKey: 'admin.dashboard.pendingCount', subParams: { count: data.pendingOrders }, trend: data.pendingOrders ? 'up' as const : 'neutral' as const },
          { labelKey: 'admin.dashboard.activeWorkers', value: String(data.activeWorkers), subKey: 'admin.dashboard.ofStaff', subParams: { count: data.totalWorkers }, trend: 'neutral' },
          { labelKey: 'admin.dashboard.tablesOccupied', value: String(data.menuItems), subKey: 'admin.dashboard.hiddenCount', subParams: { count: data.unavailableMenuItems }, trend: 'neutral' },
        ];
        this.recentOrders = data.recentOrders;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = this.translate.translate('admin.dashboard.loadError');
        this.loading = false;
      }
    });
  }
}
