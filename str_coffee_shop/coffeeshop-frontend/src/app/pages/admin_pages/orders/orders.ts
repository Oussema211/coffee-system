import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Order {
  id: number;
  items: string[];
  total: number;
  worker: string;
  time: string;
  status: 'Completed' | 'Refunded';
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders.html'
})
export class Orders {
  orders: Order[] = [
    { id: 1042, items: ['Cappuccino', 'Croissant'], total: 5.70, worker: 'Sarah Miller', time: '9:12 AM', status: 'Completed' },
    { id: 1043, items: ['Espresso'], total: 2.50, worker: 'James Cooper', time: '9:20 AM', status: 'Completed' },
    { id: 1044, items: ['Latte', 'Blueberry Muffin'], total: 6.60, worker: 'Sarah Miller', time: '9:35 AM', status: 'Completed' },
    { id: 1045, items: ['Iced Americano'], total: 3.00, worker: 'James Cooper', time: '9:41 AM', status: 'Refunded' },
    { id: 1046, items: ['Cappuccino'], total: 3.50, worker: 'Sarah Miller', time: '10:02 AM', status: 'Completed' }
  ];

  get todaysTotal(): number {
    return this.orders.filter(o => o.status === 'Completed').reduce((sum, o) => sum + o.total, 0);
  }
}