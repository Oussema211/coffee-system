import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ActiveOrder {
  id: number;
  table: number | null;
  type: 'Dine-in' | 'Takeaway' | 'QR';
  items: string[];
  total: number;
  time: string;
  status: 'Preparing' | 'Ready' | 'Served';
}

@Component({
  selector: 'app-active-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './active-orders.html',
  styleUrl: './active-orders.css'
})
export class ActiveOrdersComponent {
  orders: ActiveOrder[] = [
    { id: 1047, table: 6, type: 'Dine-in', items: ['Latte', 'Croissant'], total: 6.00, time: '10:12 AM', status: 'Preparing' },
    { id: 1048, table: null, type: 'Takeaway', items: ['Espresso x2'], total: 5.00, time: '10:15 AM', status: 'Ready' },
    { id: 1049, table: 1, type: 'Dine-in', items: ['Cappuccino'], total: 3.50, time: '10:18 AM', status: 'Preparing' },
    { id: 1050, table: 4, type: 'QR', items: ['Iced Americano', 'Blueberry Muffin'], total: 5.80, time: '10:20 AM', status: 'Ready' },
  ];

  get preparing(): ActiveOrder[] {
    return this.orders.filter(o => o.status === 'Preparing');
  }

  get ready(): ActiveOrder[] {
    return this.orders.filter(o => o.status === 'Ready');
  }

  advance(order: ActiveOrder): void {
    if (order.status === 'Preparing') {
      order.status = 'Ready';
    } else if (order.status === 'Ready') {
      order.status = 'Served';
      // Served orders drop off the active board a beat later.
      setTimeout(() => {
        this.orders = this.orders.filter(o => o.id !== order.id);
      }, 400);
    }
  }

  typeClasses(type: ActiveOrder['type']): string {
    switch (type) {
      case 'Dine-in': return 'bg-caramel/10 text-caramel-dark';
      case 'Takeaway': return 'bg-cream-dark text-espresso-light/70';
      case 'QR': return 'bg-sage/15 text-sage';
    }
  }
}