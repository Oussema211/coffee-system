import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboardComponent {
  username: string | null;

  stats = [
    { label: "Today's revenue",  value: '$148.20', sub: '+12% vs yesterday',  trend: 'up' },
    { label: 'Orders today',     value: '24',       sub: '2 pending',           trend: 'up' },
    { label: 'Active workers',   value: '2',        sub: 'of 3 staff',          trend: 'neutral' },
    { label: 'Menu items',       value: '6',        sub: '1 hidden',            trend: 'neutral' },
  ];

  recentOrders = [
    { id: 1046, items: 'Cappuccino',                worker: 'Sarah M.',  total: 3.50, status: 'Completed' },
    { id: 1045, items: 'Iced Americano',             worker: 'James C.',  total: 3.00, status: 'Refunded'  },
    { id: 1044, items: 'Latte, Blueberry Muffin',   worker: 'Sarah M.',  total: 6.60, status: 'Completed' },
    { id: 1043, items: 'Espresso',                   worker: 'James C.',  total: 2.50, status: 'Completed' },
  ];

  constructor(private auth: AuthService) {
    this.username = this.auth.getUsername();
  }
}