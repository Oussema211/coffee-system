import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth.service';

interface TouchCard {
  id: string;
  title: string;
  subtitle: string;
  route: string;
  badge?: string;
  badgeColor?: string;
  theme: string;
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
  clockedIn = true;
  shiftStart: string | null = '08:30 AM';

  stats = [
    { label: 'Orders served', value: '18', sub: 'this shift' },
    { label: 'Tables active', value: '3', sub: 'of 8 tables' },
    { label: 'QR orders pending', value: '2', sub: 'need attention' },
  ];

  touchCards: TouchCard[] = [
    {
      id: 'card-new-order',
      title: 'New Order (POS)',
      subtitle: 'Tap to start a new dine-in or takeaway order',
      route: '/worker/new-order',
      badge: 'START HERE',
      badgeColor: 'bg-emerald-500 text-white',
      theme: 'card-primary'
    },
    {
      id: 'card-active-orders',
      title: 'Active Orders',
      subtitle: 'View and manage orders currently in progress',
      route: '/worker/active-orders',
      badge: '3 IN PROGRESS',
      badgeColor: 'bg-amber-500 text-white',
      theme: 'card-amber'
    },
    {
      id: 'card-qr-orders',
      title: 'QR Customer Orders',
      subtitle: 'Review incoming customer mobile QR orders',
      route: '/worker/qr-orders',
      badge: '2 PENDING',
      badgeColor: 'bg-rose-500 text-white',
      theme: 'card-rose'
    },
    {
      id: 'card-tables',
      title: 'Tables Management',
      subtitle: 'Check floor tables, occupied seats and availability',
      route: '/worker/tables',
      badge: '5 FREE TABLES',
      badgeColor: 'bg-blue-500 text-white',
      theme: 'card-blue'
    }
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