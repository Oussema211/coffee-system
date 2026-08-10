import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { OrderDTO, OrderService } from '../../../core/order.service';

import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-qr-orders',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './qr-orders.html',
  styleUrl: './qr-orders.css'
})
export class QrOrdersComponent implements OnInit, OnDestroy {
  pending: OrderDTO[] = [];
  loading = true;
  error = '';
  updatingId: number | null = null;
  private refreshTimer?: ReturnType<typeof setInterval>;

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
    this.refreshTimer = setInterval(() => this.loadOrders(false), 15000);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  loadOrders(showLoading = true): void {
    if (showLoading) this.loading = true;
    this.orderService.getPendingQrOrders().subscribe({
      next: (orders) => { this.pending = orders; this.error = ''; this.loading = false; },
      error: () => { this.error = 'Could not load incoming QR orders.'; this.loading = false; }
    });
  }

  accept(order: OrderDTO): void {
    this.update(order, 'Preparing');
  }

  decline(order: OrderDTO): void {
    this.updatingId = order.id;
    this.orderService.cancelOrder(order.id).subscribe({
      next: () => { this.pending = this.pending.filter(item => item.id !== order.id); this.updatingId = null; },
      error: () => { this.error = 'Could not decline this order. Please try again.'; this.updatingId = null; }
    });
  }

  private update(order: OrderDTO, status: 'Preparing'): void {
    this.updatingId = order.id;
    this.orderService.updateOrderStatus(order.id, status).subscribe({
      next: () => { this.pending = this.pending.filter(item => item.id !== order.id); this.updatingId = null; },
      error: () => { this.error = 'Could not accept this order. Please try again.'; this.updatingId = null; }
    });
  }
}
