import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { OrderDTO, OrderService } from '../../../core/order.service';
import { TranslationService } from '../../../core/translation.service';
import { WebSocketService } from '../../../core/websocket.service';

import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { LoadingComponent } from '../../../core/components/loading/loading';

@Component({
  selector: 'app-qr-orders',
  standalone: true,
  imports: [CommonModule, TranslatePipe, LoadingComponent],
  templateUrl: './qr-orders.html',
  styleUrl: './qr-orders.css'
})
export class QrOrdersComponent implements OnInit, OnDestroy {
  pending: OrderDTO[] = [];
  loading = true;
  error = '';
  updatingId: number | null = null;
  private refreshTimer?: ReturnType<typeof setInterval>;
  private wsSubscription?: Subscription;

  constructor(
    private orderService: OrderService,
    private translate: TranslationService,
    private wsService: WebSocketService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.refreshTimer = setInterval(() => this.loadOrders(false), 15000);
    this.wsSubscription = this.wsService.orderEvents$.subscribe((event) => {
      if (event?.type === 'NEW_QR_ORDER' && event.data?.id) {
        const exists = this.pending.some(o => o.id === event.data.id);
        if (!exists) {
          this.pending = [event.data, ...this.pending];
        }
      }
      this.loadOrders(false);
    });
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    if (this.wsSubscription) this.wsSubscription.unsubscribe();
  }

  loadOrders(showLoading = true): void {
    if (showLoading) this.loading = true;
    this.orderService.getPendingQrOrders().subscribe({
      next: (orders) => { this.pending = orders; this.error = ''; this.loading = false; },
      error: () => { this.error = this.translate.translate('worker.qrOrders.loadError'); this.loading = false; }
    });
  }

  modsLabel(item: { size?: string; sugar?: string }): string {
    const parts: string[] = [];
    if (item.size) parts.push(item.size);
    if (item.sugar) parts.push(item.sugar);
    return parts.join(' · ');
  }

  accept(order: OrderDTO): void {
    this.pending = this.pending.filter(item => item.id !== order.id);
    this.orderService.notifyOrderStateChanged();
    this.update(order, 'Preparing');
  }

  decline(order: OrderDTO): void {
    this.pending = this.pending.filter(item => item.id !== order.id);
    this.orderService.notifyOrderStateChanged();
    this.updatingId = order.id;
    this.orderService.cancelOrder(order.id).subscribe({
      next: () => { this.updatingId = null; },
      error: () => { this.error = this.translate.translate('worker.qrOrders.declineError'); this.updatingId = null; this.loadOrders(false); }
    });
  }

  private update(order: OrderDTO, status: 'Preparing'): void {
    this.updatingId = order.id;
    this.orderService.updateOrderStatus(order.id, status).subscribe({
      next: () => { this.pending = this.pending.filter(item => item.id !== order.id); this.updatingId = null; },
      error: () => { this.error = this.translate.translate('worker.qrOrders.acceptError'); this.updatingId = null; }
    });
  }
}
