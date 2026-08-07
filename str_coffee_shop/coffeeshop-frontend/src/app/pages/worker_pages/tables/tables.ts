import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface TableInfo {
  id: number;
  number: number;
  seats: number;
  status: 'Available' | 'Occupied' | 'Reserved' | 'Cleaning';
  since?: string;
}

@Component({
  selector: 'app-tables',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tables.html',
  styleUrl: './tables.css'
})
export class TablesComponent {
  tables: TableInfo[] = [
    { id: 1, number: 1, seats: 2, status: 'Occupied', since: '9:10 AM' },
    { id: 2, number: 2, seats: 4, status: 'Available' },
    { id: 3, number: 3, seats: 2, status: 'Available' },
    { id: 4, number: 4, seats: 6, status: 'Reserved', since: '11:30 AM' },
    { id: 5, number: 5, seats: 2, status: 'Cleaning' },
    { id: 6, number: 6, seats: 4, status: 'Occupied', since: '9:45 AM' },
    { id: 7, number: 7, seats: 2, status: 'Available' },
    { id: 8, number: 8, seats: 4, status: 'Available' },
  ];

  constructor(private router: Router) {}

  // Tap a table to move it through its everyday states.
  // Reserved tables are left alone — clear them with the "Seat now" action instead.
  cycleStatus(table: TableInfo): void {
    if (table.status === 'Reserved') return;
    const order: TableInfo['status'][] = ['Available', 'Occupied', 'Cleaning'];
    const idx = order.indexOf(table.status);
    table.status = order[(idx + 1) % order.length];
    table.since = table.status === 'Occupied'
      ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : undefined;
  }

  seatReserved(table: TableInfo): void {
    table.status = 'Occupied';
    table.since = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  startOrder(table: TableInfo): void {
    this.router.navigate(['/worker/new-order'], { queryParams: { table: table.number } });
  }

  statusClasses(status: TableInfo['status']): string {
    switch (status) {
      case 'Available': return 'bg-sage/15 text-sage';
      case 'Occupied': return 'bg-caramel/20 text-caramel-dark';
      case 'Reserved': return 'bg-espresso/10 text-espresso-light';
      case 'Cleaning': return 'bg-espresso/6 text-espresso-light/70';
    }
  }

  get counts() {
    return {
      available: this.tables.filter(t => t.status === 'Available').length,
      occupied: this.tables.filter(t => t.status === 'Occupied').length,
    };
  }
}