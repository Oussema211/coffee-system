import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface QROrder {
  id: number;
  table: number;
  items: string[];
  total: number;
  time: string;
  note?: string;
}

@Component({
  selector: 'app-qr-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qr-orders.html',
  styleUrl: './qr-orders.css'
})
export class QrOrdersComponent {
  pending: QROrder[] = [
    { id: 2001, table: 3, items: ['Latte', 'Croissant'], total: 6.00, time: '10:22 AM' },
    { id: 2002, table: 7, items: ['Espresso'], total: 2.50, time: '10:24 AM', note: 'Extra hot please' },
  ];

  acceptingId: number | null = null;

  // Accepting moves the order onto the Active Orders board (in a real app this
  // would go through a shared OrdersService instead of just clearing the list).
  accept(order: QROrder): void {
    this.acceptingId = order.id;
    setTimeout(() => {
      this.pending = this.pending.filter(o => o.id !== order.id);
      this.acceptingId = null;
    }, 400);
  }

  reject(order: QROrder): void {
    this.pending = this.pending.filter(o => o.id !== order.id);
  }
}