import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { TableService } from '../../../core/table.service';

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
export class WorkerDashboardComponent implements OnInit {
  username: string | null;
  clockedIn = true;
  shiftStart: string | null = '08:30 AM';

  stats = [
    { label: 'Orders served', value: '18', sub: 'this shift' },
    { label: 'Tables active', value: '3', sub: 'of 0 tables' },
    { label: 'QR orders pending', value: '2', sub: 'need attention' },
  ];

  touchCards: TouchCard[] = [
    {
      id: 'card-new-order',
      title: 'New Order (POS)',
      subtitle: 'Tap to start a new dine-in or takeaway order',
      route: '/worker/new-order',
      badge: 'START HERE',
      badgeColor: 'bg-espresso text-cream',
      theme: 'card-new-order'
    },
    {
      id: 'card-active-orders',
      title: 'Active Orders',
      subtitle: 'View and manage orders currently in progress',
      route: '/worker/active-orders',
      badge: '3 IN PROGRESS',
      badgeColor: 'bg-caramel text-white',
      theme: 'card-active-orders'
    },
    {
      id: 'card-qr-orders',
      title: 'QR Customer Orders',
      subtitle: 'Review incoming customer mobile QR orders',
      route: '/worker/qr-orders',
      badge: '2 PENDING',
      badgeColor: 'bg-caramel-dark text-cream',
      theme: 'card-qr-orders'
    },
    {
      id: 'card-tables',
      title: 'Tables Management',
      subtitle: 'Check floor tables, occupied seats and availability',
      route: '/worker/tables',
      badge: '0 FREE TABLES',
      badgeColor: 'bg-sage text-cream',
      theme: 'card-tables'
    }
  ];

  constructor(private auth: AuthService, private tableService: TableService) {
    this.username = this.auth.getUsername();
  }

  ngOnInit(): void {
    this.tableService.getWorkerTables().subscribe({
      next: (tables) => {
        const total = tables.length;
        const free = tables.filter(t => t.status === 'Available').length;
        
        const tableStat = this.stats.find(s => s.label === 'Tables active');
        if (tableStat) {
          tableStat.sub = `of ${total} table${total === 1 ? '' : 's'}`;
        }

        const tableCard = this.touchCards.find(c => c.id === 'card-tables');
        if (tableCard) {
          tableCard.badge = `${free} FREE TABLE${free === 1 ? '' : 'S'}`;
        }
      },
      error: () => {}
    });
  }

  toggleClock(): void {
    this.clockedIn = !this.clockedIn;
    this.shiftStart = this.clockedIn
      ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : null;
  }
}