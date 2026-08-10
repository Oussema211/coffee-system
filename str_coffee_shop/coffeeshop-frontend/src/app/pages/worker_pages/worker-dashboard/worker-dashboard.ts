import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { TableService } from '../../../core/table.service';
import { OrderService } from '../../../core/order.service';
import { interval, Subscription } from 'rxjs';

interface StatTile {
  label: string;
  value: string;
  sub: string;
  accent: string;
  route?: string;
  alert?: boolean;
}

interface AlertItem {
  message: string;
  route: string;
  action: string;
  type: 'warning' | 'info';
}

@Component({
  selector: 'app-worker-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './worker-dashboard.html',
  styleUrl: './worker-dashboard.css'
})
export class WorkerDashboardComponent implements OnInit, OnDestroy {
  username: string | null;
  clockedIn = true;
  shiftStart: string | null = '08:30 AM';
  liveTime = '';
  liveDate = '';

  stats: StatTile[] = [
    { label: 'In Progress', value: '0', sub: 'preparing or ready', accent: 'accent-caramel', route: '/worker/active-orders' },
    { label: 'QR Pending', value: '0', sub: 'awaiting approval', accent: 'accent-espresso', route: '/worker/qr-orders', alert: false },
    { label: 'Tables Free', value: '0', sub: 'of 0 total', accent: 'accent-sage', route: '/worker/tables' },
    { label: 'Served Today', value: '0', sub: 'completed orders', accent: 'accent-cream', route: '/worker/active-orders' },
  ];

  alerts: AlertItem[] = [];

  private subs = new Subscription();
  private clockTimer?: ReturnType<typeof setInterval>;

  constructor(
    private auth: AuthService,
    private tableService: TableService,
    private orderService: OrderService
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

  toggleClock(): void {
    this.clockedIn = !this.clockedIn;
    this.shiftStart = this.clockedIn
      ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : null;
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

        const tableStat = this.stats.find(s => s.label === 'Tables Free');
        if (tableStat) {
          tableStat.value = String(free);
          tableStat.sub = `${occupied} occupied · ${total} total`;
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

        const progressStat = this.stats.find(s => s.label === 'In Progress');
        if (progressStat) {
          progressStat.value = String(inProgress);
          progressStat.sub = ready > 0 ? `${ready} ready to serve` : 'preparing or ready';
          progressStat.alert = ready > 0;
        }

        const qrStat = this.stats.find(s => s.label === 'QR Pending');
        if (qrStat) {
          qrStat.value = String(qrPending);
          qrStat.sub = qrPending > 0 ? 'needs your approval' : 'all clear';
          qrStat.alert = qrPending > 0;
        }

        const servedStat = this.stats.find(s => s.label === 'Served Today');
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
        message: `${qrPending} QR order${qrPending > 1 ? 's' : ''} waiting for approval`,
        route: '/worker/qr-orders',
        action: 'Review',
        type: 'warning'
      });
    }
    if (ready > 0) {
      this.alerts.push({
        message: `${ready} order${ready > 1 ? 's' : ''} ready to serve`,
        route: '/worker/active-orders',
        action: 'View',
        type: 'info'
      });
    }
    if (inProgress === 0 && qrPending === 0) {
      this.alerts.push({
        message: 'No active orders — ready for the next customer',
        route: '/worker/new-order',
        action: 'New Order',
        type: 'info'
      });
    }
  }
}
