import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

export interface OrderItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  seatLabel?: string; // e.g. "Seat 1", "Guest A"
  paid: boolean;
  selected: boolean; // used in split-bill mode
}

interface TableInfo {
  id: number;
  number: number;
  seats: number;
  status: 'Available' | 'Occupied' | 'Reserved' | 'Cleaning';
  since?: string;
  orderItems: OrderItem[];
}

@Component({
  selector: 'app-tables',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tables.html',
  styleUrl: './tables.css'
})
export class TablesComponent {
  tables: TableInfo[] = [
    {
      id: 1, number: 1, seats: 2, status: 'Occupied', since: '9:10 AM',
      orderItems: [
        { id: 1, name: 'Espresso', price: 2.5, qty: 1, seatLabel: 'Seat 1', paid: false, selected: false },
        { id: 2, name: 'Croissant', price: 2.2, qty: 2, seatLabel: 'Seat 2', paid: false, selected: false },
      ]
    },
    { id: 2, number: 2, seats: 4, status: 'Available', orderItems: [] },
    { id: 3, number: 3, seats: 2, status: 'Available', orderItems: [] },
    {
      id: 4, number: 4, seats: 6, status: 'Reserved', since: '11:30 AM',
      orderItems: []
    },
    { id: 5, number: 5, seats: 2, status: 'Cleaning', orderItems: [] },
    {
      id: 6, number: 6, seats: 4, status: 'Occupied', since: '9:45 AM',
      orderItems: [
        { id: 10, name: 'Latte', price: 3.8, qty: 1, seatLabel: 'Seat 1', paid: false, selected: false },
        { id: 11, name: 'Cappuccino', price: 3.5, qty: 1, seatLabel: 'Seat 2', paid: false, selected: false },
        { id: 12, name: 'Blueberry Muffin', price: 2.8, qty: 2, seatLabel: 'Seat 3', paid: false, selected: false },
        { id: 13, name: 'Iced Americano', price: 3.0, qty: 1, seatLabel: 'Seat 4', paid: false, selected: false },
      ]
    },
    { id: 7, number: 7, seats: 2, status: 'Available', orderItems: [] },
    { id: 8, number: 8, seats: 4, status: 'Available', orderItems: [] },
  ];

  // ── Payment modal state ──────────────────────────────────────────────────────
  paymentModalOpen = false;
  activePaymentTable: TableInfo | null = null;
  paymentMode: 'full' | 'split' = 'full';
  amountGiven: number | null = null;

  // Payment success flash
  paymentSuccess = false;
  paymentSuccessMessage = '';

  constructor(private router: Router) {}

  // ── Derived getters ──────────────────────────────────────────────────────────

  /** Unpaid items on the active table */
  get unpaidItems(): OrderItem[] {
    return this.activePaymentTable?.orderItems.filter(i => !i.paid) ?? [];
  }

  /** Full bill total (all unpaid items) */
  get fullTotal(): number {
    return this.unpaidItems.reduce((s, i) => s + i.price * i.qty, 0);
  }

  /** Split bill — total of checked items only */
  get splitTotal(): number {
    return this.unpaidItems
      .filter(i => i.selected)
      .reduce((s, i) => s + i.price * i.qty, 0);
  }

  /** The amount this payment mode is requesting */
  get currentTotal(): number {
    return this.paymentMode === 'full' ? this.fullTotal : this.splitTotal;
  }

  /** Change to give back */
  get change(): number {
    if (this.amountGiven == null) return 0;
    return Math.max(0, this.amountGiven - this.currentTotal);
  }

  /** Shortfall — customer hasn't given enough */
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

  // ── Quick-amount helpers ─────────────────────────────────────────────────────
  get quickAmounts(): number[] {
    const total = this.currentTotal;
    const exact = Math.ceil(total * 100) / 100;
    const round = [
      Math.ceil(total),
      Math.ceil(total / 5) * 5,
      Math.ceil(total / 10) * 10,
    ];
    const candidates = [exact, ...round];
    // Deduplicate and filter amounts >= total
    const unique = [...new Set(candidates)].filter(a => a >= total).sort((a, b) => a - b);
    return unique.slice(0, 4);
  }

  // ── Modal open/close ─────────────────────────────────────────────────────────
  openPayment(table: TableInfo): void {
    this.activePaymentTable = table;
    this.paymentMode = 'full';
    this.amountGiven = null;
    // Reset split selections
    table.orderItems.forEach(i => (i.selected = false));
    this.paymentModalOpen = true;
  }

  closePayment(): void {
    this.paymentModalOpen = false;
    this.activePaymentTable = null;
    this.amountGiven = null;
  }

  switchMode(mode: 'full' | 'split'): void {
    this.paymentMode = mode;
    this.amountGiven = null;
    // Reset selections when switching
    this.activePaymentTable?.orderItems.forEach(i => (i.selected = false));
  }

  // ── Payment actions ──────────────────────────────────────────────────────────
  confirmFullPayment(): void {
    if (!this.canConfirm || !this.activePaymentTable) return;
    const table = this.activePaymentTable;
    // Mark all items paid
    table.orderItems.forEach(i => (i.paid = true));
    this.flashSuccess(`Table ${table.number} fully paid. Change: ${this.change.toFixed(2)} TND`);
    this.closePayment();
    table.status = 'Cleaning';
    table.since = undefined;
  }

  confirmSplitPayment(): void {
    if (!this.canConfirm || !this.activePaymentTable) return;
    const table = this.activePaymentTable;
    const selectedItems = table.orderItems.filter(i => i.selected && !i.paid);
    selectedItems.forEach(i => {
      i.paid = true;
      i.selected = false;
    });

    const changeAmt = this.change;
    // If everything is now paid, clear the table
    const allPaid = table.orderItems.every(i => i.paid);
    if (allPaid) {
      this.flashSuccess(`All items paid. Change: ${changeAmt.toFixed(2)} TND. Table cleared!`);
      this.closePayment();
      table.status = 'Cleaning';
      table.since = undefined;
    } else {
      this.flashSuccess(`Partial payment confirmed. Change: ${changeAmt.toFixed(2)} TND`);
      // Reset for next person
      this.amountGiven = null;
    }
  }

  setQuickAmount(amount: number): void {
    this.amountGiven = amount;
  }

  // ── Table status cycling ─────────────────────────────────────────────────────
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

  tableTotal(table: TableInfo): number {
    return table.orderItems.filter(i => !i.paid).reduce((s, i) => s + i.price * i.qty, 0);
  }

  private flashSuccess(message: string): void {
    this.paymentSuccessMessage = message;
    this.paymentSuccess = true;
    setTimeout(() => (this.paymentSuccess = false), 3500);
  }
}