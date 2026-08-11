import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { TableService } from '../../../core/table.service';
import { OrderService } from '../../../core/order.service';
import { interval, Subscription } from 'rxjs';
import { TranslationService } from '../../../core/translation.service';

interface StatTile {
  labelKey: string;
  value: string;
  subKey: string;
  subParams: Record<string, any>;
  accent: string;
  route?: string;
  alert?: boolean;
}

interface AlertItem {
  messageKey: string;
  messageParams: Record<string, any>;
  route: string;
  actionKey: string;
  type: 'warning' | 'info';
}

import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-worker-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './worker-dashboard.html',
  styleUrl: './worker-dashboard.css'
})
export class WorkerDashboardComponent implements OnInit, OnDestroy {
  username: string | null;
  liveTime = '';
  liveDate = '';

  stats: StatTile[] = [
    { labelKey: 'worker.dashboard.inProgress', value: '0', subKey: 'common.loading', subParams: {}, accent: 'accent-caramel', route: '/worker/active-orders' },
    { labelKey: 'worker.dashboard.qrPending', value: '0', subKey: 'common.loading', subParams: {}, accent: 'accent-espresso', route: '/worker/qr-orders', alert: false },
    { labelKey: 'worker.dashboard.tablesFree', value: '0', subKey: 'common.loading', subParams: {}, accent: 'accent-sage', route: '/worker/tables' },
    { labelKey: 'worker.dashboard.servedToday', value: '0', subKey: 'common.loading', subParams: {}, accent: 'accent-cream', route: '/worker/active-orders' },
  ];

  alerts: AlertItem[] = [];

  private subs = new Subscription();
  private clockTimer?: ReturnType<typeof setInterval>;

  constructor(
    private auth: AuthService,
    private tableService: TableService,
    private orderService: OrderService,
    private translate: TranslationService
  ) {
    this.username = this.auth.getUsername();
  }

  ngOnInit(): void {
    this.tickClock();
    this.clockTimer = setInterval(() => this.tickClock(), 1000);
    this.refreshData();
    this.subs.add(interval(15_000).subscribe(() => this.refreshData()));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (this.clockTimer) clearInterval(this.clockTimer);
  }

  private tickClock(): void {
    const now = new Date();
    this.liveTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.liveDate = now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  }

  private refreshData(): void {
    this.tableService.getWorkerTables().subscribe({
      next: (tables) => {
        const total = tables.length;
        const free = tables.filter(t => t.status === 'Available').length;
        const occupied = tables.filter(t => t.status === 'Occupied').length;

        const tableStat = this.stats.find(s => s.labelKey === 'worker.dashboard.tablesFree');
        if (tableStat) {
          tableStat.value = String(free);
          tableStat.subKey = 'worker.dashboard.tablesFreeSub';
          tableStat.subParams = { occupied, total };
        }
      },
      error: () => {}
    });

    this.orderService.getAllOrders().subscribe({
      next: (orders) => {
        const inProgress = orders.filter(o => o.status === 'Preparing' || o.status === 'Ready').length;
        const qrPending = orders.filter(o => o.type === 'QR' && o.status === 'Pending').length;
        const ready = orders.filter(o => o.status === 'Ready').length;
        const served = orders.filter(o => o.status === 'Served' || o.status === 'Completed').length;

        const progressStat = this.stats.find(s => s.labelKey === 'worker.dashboard.inProgress');
        if (progressStat) {
          progressStat.value = String(inProgress);
          progressStat.subKey = ready > 0 ? 'worker.dashboard.readyToServe' : 'worker.dashboard.preparingOrReady';
          progressStat.subParams = ready > 0 ? { count: ready } : {};
          progressStat.alert = ready > 0;
        }

        const qrStat = this.stats.find(s => s.labelKey === 'worker.dashboard.qrPending');
        if (qrStat) {
          qrStat.value = String(qrPending);
          qrStat.subKey = qrPending > 0 ? 'worker.dashboard.needsApproval' : 'worker.dashboard.allClear';
          qrStat.subParams = {};
          qrStat.alert = qrPending > 0;
        }

        const servedStat = this.stats.find(s => s.labelKey === 'worker.dashboard.servedToday');
        if (servedStat) servedStat.value = String(served);

        this.buildAlerts(qrPending, ready, inProgress);
      },
      error: () => {}
    });
  }

  private buildAlerts(qrPending: number, ready: number, inProgress: number): void {
    this.alerts = [];
    if (qrPending > 0) {
      this.alerts.push({
        messageKey: 'worker.dashboard.qrPending',
        messageParams: { count: qrPending },
        route: '/worker/qr-orders',
        actionKey: 'worker.dashboard.review',
        type: 'warning'
      });
    }
    if (ready > 0) {
      this.alerts.push({
        messageKey: 'worker.dashboard.readyToServe',
        messageParams: { count: ready },
        route: '/worker/active-orders',
        actionKey: 'worker.dashboard.view',
        type: 'info'
      });
    }
    if (inProgress === 0 && qrPending === 0) {
      this.alerts.push({
        messageKey: 'worker.dashboard.noActiveOrders',
        messageParams: {},
        route: '/worker/new-order',
        actionKey: 'worker.dashboard.newOrderAction',
        type: 'info'
      });
    }
  }
}
