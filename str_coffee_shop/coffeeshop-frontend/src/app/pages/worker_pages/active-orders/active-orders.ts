import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface OrderItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  paid: boolean;
  selected: boolean;
}

export interface ActiveOrder {
  id: number;
  table: number | null;
  type: 'Dine-in' | 'Takeaway' | 'QR';
  items: string[];
  orderItems: OrderItem[];
  total: number;
  time: string;
  status: 'Preparing' | 'Ready' | 'Served';
}

@Component({
  selector: 'app-active-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './active-orders.html',
  styleUrl: './active-orders.css'
})
export class ActiveOrdersComponent {
  orders: ActiveOrder[] = [
    {
      id: 1047, table: 6, type: 'Dine-in', items: ['Latte', 'Croissant'], total: 6.00, time: '10:12 AM', status: 'Preparing',
      orderItems: [
        { id: 101, name: 'Latte', price: 3.80, qty: 1, paid: false, selected: false },
        { id: 102, name: 'Croissant', price: 2.20, qty: 1, paid: false, selected: false }
      ]
    },
    {
      id: 1048, table: null, type: 'Takeaway', items: ['Espresso x2'], total: 5.00, time: '10:15 AM', status: 'Ready',
      orderItems: [
        { id: 103, name: 'Espresso', price: 2.50, qty: 2, paid: false, selected: false }
      ]
    },
    {
      id: 1049, table: 1, type: 'Dine-in', items: ['Cappuccino'], total: 3.50, time: '10:18 AM', status: 'Preparing',
      orderItems: [
        { id: 104, name: 'Cappuccino', price: 3.50, qty: 1, paid: false, selected: false }
      ]
    },
    {
      id: 1050, table: 4, type: 'QR', items: ['Iced Americano', 'Blueberry Muffin'], total: 5.80, time: '10:20 AM', status: 'Ready',
      orderItems: [
        { id: 105, name: 'Iced Americano', price: 3.00, qty: 1, paid: false, selected: false },
        { id: 106, name: 'Blueberry Muffin', price: 2.80, qty: 1, paid: false, selected: false }
      ]
    },
  ];

  // ── Payment modal state ──────────────────────────────────────────────────────
  paymentModalOpen = false;
  activePaymentOrder: ActiveOrder | null = null;
  paymentMode: 'full' | 'split' = 'full';
  amountGiven: number | null = null;

  // Payment success flash
  paymentSuccess = false;
  paymentSuccessMessage = '';

  get preparing(): ActiveOrder[] {
    return this.orders.filter(o => o.status === 'Preparing');
  }

  get readyAndServed(): ActiveOrder[] {
    return this.orders.filter(o => o.status === 'Ready' || o.status === 'Served');
  }

  advance(order: ActiveOrder): void {
    if (order.status === 'Preparing') {
      order.status = 'Ready';
    } else if (order.status === 'Ready') {
      order.status = 'Served';
    }
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
      .filter(i => i.selected)
      .reduce((s, i) => s + i.price * i.qty, 0);
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
    if (this.paymentMode === 'split' && this.unpaidItems.filter(i => i.selected).length === 0) return false;
    if (this.amountGiven == null || this.amountGiven < this.currentTotal) return false;
    return true;
  }

  get hasSplitSelection(): boolean {
    return this.unpaidItems.some(i => i.selected);
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
    order.orderItems.forEach(i => (i.selected = false));
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
    this.activePaymentOrder?.orderItems.forEach(i => (i.selected = false));
  }

  setQuickAmount(amount: number): void {
    this.amountGiven = amount;
  }

  confirmFullPayment(): void {
    if (!this.canConfirm || !this.activePaymentOrder) return;
    const order = this.activePaymentOrder;
    order.orderItems.forEach(i => (i.paid = true));
    const changeAmt = this.change;
    this.flashSuccess(`Order #${order.id} fully paid. Change: ${changeAmt.toFixed(2)} TND`);
    this.closePayment();
    this.orders = this.orders.filter(o => o.id !== order.id);
  }

  confirmSplitPayment(): void {
    if (!this.canConfirm || !this.activePaymentOrder) return;
    const order = this.activePaymentOrder;
    const selectedItems = order.orderItems.filter(i => i.selected && !i.paid);
    selectedItems.forEach(i => {
      i.paid = true;
      i.selected = false;
    });

    const changeAmt = this.change;
    const allPaid = order.orderItems.every(i => i.paid);
    if (allPaid) {
      this.flashSuccess(`Order #${order.id} fully paid. Change: ${changeAmt.toFixed(2)} TND. Order completed!`);
      this.closePayment();
      this.orders = this.orders.filter(o => o.id !== order.id);
    } else {
      this.flashSuccess(`Partial payment confirmed for Order #${order.id}. Change: ${changeAmt.toFixed(2)} TND`);
      this.amountGiven = null;
    }
  }

  typeClasses(type: ActiveOrder['type']): string {
    switch (type) {
      case 'Dine-in': return 'bg-caramel/10 text-caramel-dark';
      case 'Takeaway': return 'bg-cream-dark text-espresso-light/70';
      case 'QR': return 'bg-sage/15 text-sage';
    }
  }

  private flashSuccess(message: string): void {
    this.paymentSuccessMessage = message;
    this.paymentSuccess = true;
    setTimeout(() => (this.paymentSuccess = false), 3500);
  }
}