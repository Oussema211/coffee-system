import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService, OrderDTO, OrderItemDTO } from '../../../core/order.service';
import { ReceiptPrintService } from '../../../core/receipt-print.service';

export type OrderItem = OrderItemDTO;
export type ActiveOrder = OrderDTO;

import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { LoadingComponent } from '../../../core/components/loading/loading';

@Component({
  selector: 'app-active-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, LoadingComponent],
  templateUrl: './active-orders.html',
  styleUrl: './active-orders.css'
})
export class ActiveOrdersComponent implements OnInit {
  orders: ActiveOrder[] = [];
  loading = true;
  error = '';

  advancingId: number | null = null;
  paying = false;
  cancelling = false;

  // ── Payment modal state ──────────────────────────────────────────────────────
  paymentModalOpen = false;
  activePaymentOrder: ActiveOrder | null = null;
  paymentMode: 'full' | 'split' = 'full';
  amountGiven: number | null = null;

  // ── Cancel Order modal state ────────────────────────────────────────────────
  cancelModalOpen = false;
  orderToCancel: ActiveOrder | null = null;

  // Payment/Action success flash
  paymentSuccess = false;
  paymentSuccessMessage = '';

  constructor(
    private orderService: OrderService,
    private receiptPrintService: ReceiptPrintService
  ) {}

  ngOnInit(): void {
    this.loadActiveOrders();
  }

  loadActiveOrders(): void {
    this.loading = true;
    this.orderService.getActiveOrders().subscribe({
      next: (data) => {
        this.orders = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load active orders from backend.';
        this.loading = false;
      }
    });
  }

  printBill(order: ActiveOrder): void {
    this.receiptPrintService.printBill(order.id);
  }

  billWasPrinted(order: ActiveOrder): boolean {
    return this.receiptPrintService.wasPrinted(order.id);
  }

  get preparing(): ActiveOrder[] {
    return this.orders.filter(o => o.status === 'Preparing');
  }

  get readyAndServed(): ActiveOrder[] {
    return this.orders.filter(o => o.status === 'Ready' || o.status === 'Served');
  }

  advance(order: ActiveOrder): void {
    let nextStatus: string | null = null;
    if (order.status === 'Preparing') {
      nextStatus = 'Ready';
    } else if (order.status === 'Ready') {
      nextStatus = 'Served';
    }

    if (!nextStatus) return;

    this.advancingId = order.id;
    this.orderService.updateOrderStatus(order.id, nextStatus).subscribe({
      next: (updatedOrder) => {
        order.status = updatedOrder.status;
        this.advancingId = null;
      },
      error: (err) => {
        this.advancingId = null;
        alert('Failed to update status: ' + (err.error?.message || 'Server error'));
      }
    });
  }

  // ── Cancel Order Actions ────────────────────────────────────────────────────

  openCancelModal(order: ActiveOrder): void {
    this.orderToCancel = order;
    this.cancelModalOpen = true;
  }

  closeCancelModal(): void {
    this.cancelModalOpen = false;
    this.orderToCancel = null;
  }

  confirmCancelOrder(): void {
    if (!this.orderToCancel) return;
    const order = this.orderToCancel;
    this.cancelling = true;
    this.orderService.cancelOrder(order.id).subscribe({
      next: () => {
        this.orders = this.orders.filter(o => o.id !== order.id);
        this.flashSuccess(`Order #${order.id} was successfully cancelled.`);
        this.closeCancelModal();
        this.cancelling = false;
      },
      error: (err) => {
        this.cancelling = false;
        alert('Failed to cancel order: ' + (err.error?.message || 'Server error'));
      }
    });
  }

  // ── Payment getters ──────────────────────────────────────────────────────────

  get unpaidItems(): OrderItem[] {
    return this.activePaymentOrder?.orderItems.filter(i => !i.paid) ?? [];
  }

  get fullTotal(): number {
    return this.unpaidItems.reduce((s, i) => s + i.price * i.qty, 0);
  }

  get splitTotal(): number {
    return this.unpaidItems
      .reduce((s, i) => s + i.price * (i.selectedQty ?? 0), 0);
  }

  get currentTotal(): number {
    return this.paymentMode === 'full' ? this.fullTotal : this.splitTotal;
  }

  get change(): number {
    if (this.amountGiven == null) return 0;
    return Math.max(0, this.amountGiven - this.currentTotal);
  }

  get shortfall(): number {
    if (this.amountGiven == null) return this.currentTotal;
    return Math.max(0, this.currentTotal - this.amountGiven);
  }

  get canConfirm(): boolean {
    if (this.paymentMode === 'split' && !this.hasSplitSelection) return false;
    if (this.amountGiven == null || this.amountGiven < this.currentTotal) return false;
    return true;
  }

  get hasSplitSelection(): boolean {
    return this.unpaidItems.some(i => (i.selectedQty ?? 0) > 0);
  }

  get quickAmounts(): number[] {
    const total = this.currentTotal;
    const exact = Math.ceil(total * 100) / 100;
    const round = [
      Math.ceil(total),
      Math.ceil(total / 5) * 5,
      Math.ceil(total / 10) * 10,
    ];
    const candidates = [exact, ...round];
    const unique = [...new Set(candidates)].filter(a => a >= total).sort((a, b) => a - b);
    return unique.slice(0, 4);
  }

  // ── Modal Actions ────────────────────────────────────────────────────────────

  openPayment(order: ActiveOrder): void {
    this.activePaymentOrder = order;
    this.paymentMode = 'full';
    this.amountGiven = null;
    order.orderItems.forEach(i => { i.selected = false; i.selectedQty = 0; });
    this.paymentModalOpen = true;
  }

  closePayment(): void {
    this.paymentModalOpen = false;
    this.activePaymentOrder = null;
    this.amountGiven = null;
  }

  switchMode(mode: 'full' | 'split'): void {
    this.paymentMode = mode;
    this.amountGiven = null;
    this.activePaymentOrder?.orderItems.forEach(i => { i.selected = false; i.selectedQty = 0; });
  }

  setQuickAmount(amount: number): void {
    this.amountGiven = amount;
  }

  toggleItemSelection(item: OrderItem): void {
    item.selectedQty = item.selectedQty ? 0 : 1;
    item.selected = !!item.selectedQty;
  }

  changeSelectedQuantity(item: OrderItem, change: number): void {
    const next = Math.max(0, Math.min(item.qty, (item.selectedQty ?? 0) + change));
    item.selectedQty = next;
    item.selected = next > 0;
  }

  get selectedQuantity(): number {
    return this.unpaidItems.reduce((total, item) => total + (item.selectedQty ?? 0), 0);
  }

  confirmFullPayment(): void {
    if (!this.canConfirm || !this.activePaymentOrder) return;
    const order = this.activePaymentOrder;

    this.paying = true;
    this.orderService.payOrder(order.id, { paymentType: 'full' }).subscribe({
      next: () => {
        this.paying = false;
        const changeAmt = this.change;
        this.flashSuccess(`Order #${order.id} fully paid. Change: ${changeAmt.toFixed(2)} TND`);
        this.closePayment();
        this.orders = this.orders.filter(o => o.id !== order.id);
      },
      error: (err) => {
        this.paying = false;
        alert('Failed to process payment: ' + (err.error?.message || 'Server error'));
      }
    });
  }

  confirmSplitPayment(): void {
    if (!this.canConfirm || !this.activePaymentOrder) return;
    const order = this.activePaymentOrder;
    this.paying = true;
    const selectedItems = order.orderItems
      .filter(i => !i.paid && i.id && (i.selectedQty ?? 0) > 0)
      .map(i => ({ itemId: i.id!, quantity: i.selectedQty! }));

    this.orderService.payOrder(order.id, { paymentType: 'split', items: selectedItems }).subscribe({
      next: (updatedOrder) => {
        this.paying = false;
        const changeAmt = this.change;
        if (updatedOrder.status === 'Completed') {
          this.flashSuccess(`Order #${order.id} fully paid. Change: ${changeAmt.toFixed(2)} TND. Order completed!`);
          this.closePayment();
          this.orders = this.orders.filter(o => o.id !== order.id);
        } else {
          this.flashSuccess(`Partial payment confirmed for Order #${order.id}. Change: ${changeAmt.toFixed(2)} TND`);
          const idx = this.orders.findIndex(o => o.id === order.id);
          if (idx !== -1) {
            this.orders[idx] = updatedOrder;
          }
          this.amountGiven = null;
        }
      },
      error: (err) => {
        this.paying = false;
        alert('Failed to process split payment: ' + (err.error?.message || 'Server error'));
      }
    });
  }

  typeClasses(type: ActiveOrder['type']): string {
    switch (type) {
      case 'Dine-in': return 'bg-caramel/10 text-caramel-dark';
      case 'Takeaway': return 'bg-cream-dark text-espresso-light/70';
      case 'QR': return 'bg-sage/15 text-sage';
      default: return 'bg-cream-dark text-espresso-light/70';
    }
  }

  private flashSuccess(message: string): void {
    this.paymentSuccessMessage = message;
    this.paymentSuccess = true;
    setTimeout(() => (this.paymentSuccess = false), 3500);
  }
}
