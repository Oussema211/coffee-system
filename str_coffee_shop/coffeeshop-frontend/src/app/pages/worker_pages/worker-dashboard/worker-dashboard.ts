import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth.service';

interface QuickAction {
  label: string;
  desc: string;
  route: string;
}

@Component({
  selector: 'app-worker-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './worker-dashboard.html',
  styleUrl: './worker-dashboard.css'
})
export class WorkerDashboardComponent {
  username: string | null;
  clockedIn = false;
  shiftStart: string | null = null;

  stats = [
    { label: 'Orders served', value: '18', sub: 'this shift' },
    { label: 'Tables active', value: '3', sub: 'of 8 tables' },
    { label: 'QR orders pending', value: '2', sub: 'need attention' },
  ];

  quickActions: QuickAction[] = [
    { label: 'New Order', desc: 'Start a dine-in or takeaway order', route: '/worker/new-order' },
    { label: 'Tables', desc: 'Check table status at a glance', route: '/worker/tables' },
    { label: 'Active Orders', desc: 'Track orders currently in progress', route: '/worker/active-orders' },
    { label: 'QR Orders', desc: 'Review orders customers placed by scanning', route: '/worker/qr-orders' },
  ];

  constructor(private auth: AuthService) {
    this.username = this.auth.getUsername();
  }

  toggleClock(): void {
    this.clockedIn = !this.clockedIn;
    this.shiftStart = this.clockedIn
      ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : null;
  }
}