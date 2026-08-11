import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableService } from '../../../core/table.service';
import { OrderService } from '../../../core/order.service';
import { ReceiptPrintService } from '../../../core/receipt-print.service';
import { TranslationService } from '../../../core/translation.service';

export interface OrderItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  seatLabel?: string; // e.g. "Seat 1", "Guest A"
  paid: boolean;
  selected: boolean; // used in split-bill mode
  selectedQty?: number;
}

interface TableInfo {
  id: number;
  number: number;
  seats: number;
  status: 'Available' | 'Occupied' | 'Reserved' | 'Cleaning';
  since?: string;
  activeOrderId?: number;
  orderItems: OrderItem[];
}

import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { LoadingComponent } from '../../../core/components/loading/loading';

@Component({
  selector: 'app-tables',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, LoadingComponent],
  templateUrl: './tables.html',
  styleUrl: './tables.css'
})
export class TablesComponent implements OnInit {
  tables: TableInfo[] = [];
  tablesLoading = true;
  tablesError = '';

  paying = false;
  updatingTableId: number | null = null;

  // ── Payment modal state ──────────────────────────────────────────────────────
  paymentModalOpen = false;
  activePaymentTable: TableInfo | null = null;
  paymentMode: 'full' | 'split' = 'full';
  amountGiven: number | null = null;

  // Payment success flash
  paymentSuccess = false;
  paymentSuccessMessage = '';

  constructor(
    private router: Router,
    private tableService: TableService,
    private orderService: OrderService,
    private receiptPrintService: ReceiptPrintService,
    private translate: TranslationService
  ) {}

  ngOnInit(): void {
    this.loadTables();
  }

  loadTables(): void {
    this.tableService.getWorkerTables().subscribe({
      next: (data) => {
        this.tables = data.map(t => ({
          id: t.id,
          number: t.number,
          seats: t.seats,
          status: (t.status as TableInfo['status']) || 'Available',
          since: t.since,
          activeOrderId: t.activeOrderId ?? undefined,
          orderItems: (t.orderItems || []).map(item => ({
            id: item.id!,
            name: item.name,
            price: item.price,
            qty: item.qty,
            paid: item.paid,
            selected: false,
            selectedQty: 0
          }))
        }));
        this.tablesLoading = false;
      },
      error: () => {
        this.tablesError = this.translate.translate('worker.tables.loadError');
        this.tablesLoading = false;
      }
    });
  }

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
      .reduce((s, i) => s + i.price * (i.selectedQty ?? 0), 0);
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
    if (this.paymentMode === 'split' && !this.hasSplitSelection) return false;
    if (this.amountGiven == null || this.amountGiven < this.currentTotal) return false;
    return true;
  }

  get hasSplitSelection(): boolean {
    return this.unpaidItems.some(i => (i.selectedQty ?? 0) > 0);
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
    table.orderItems.forEach(i => { i.selected = false; i.selectedQty = 0; });
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
    this.activePaymentTable?.orderItems.forEach(i => { i.selected = false; i.selectedQty = 0; });
  }

  // ── Payment actions ──────────────────────────────────────────────────────────
  confirmFullPayment(): void {
    if (!this.canConfirm || !this.activePaymentTable) return;
    const table = this.activePaymentTable;
    const changeAmt = this.change;

    if (!table.activeOrderId) {
      table.orderItems.forEach(i => (i.paid = true));
      this.flashSuccess(this.translate.translate('worker.tables.paymentSuccessFull', { number: table.number, change: changeAmt.toFixed(2) }));
      this.closePayment();
      table.status = 'Cleaning';
      table.since = undefined;
      return;
    }

    this.paying = true;
    this.orderService.payOrder(table.activeOrderId, { paymentType: 'full' }).subscribe({
      next: () => {
        this.paying = false;
      this.flashSuccess(this.translate.translate('worker.tables.paymentSuccessFull', { number: table.number, change: changeAmt.toFixed(2) }));
        this.closePayment();
        this.loadTables();
      },
      error: (err) => {
        this.paying = false;
        alert(this.translate.translate('worker.tables.paymentError') + ': ' + (err.error?.message || 'Server error'));
      }
    });
  }

  confirmSplitPayment(): void {
    if (!this.canConfirm || !this.activePaymentTable) return;
    const table = this.activePaymentTable;
    const changeAmt = this.change;
    const selectedItems = table.orderItems
      .filter(i => !i.paid && (i.selectedQty ?? 0) > 0)
      .map(i => ({ itemId: i.id, quantity: i.selectedQty! }));

    if (!table.activeOrderId) {
      table.orderItems.filter(i => !i.paid && (i.selectedQty ?? 0) > 0).forEach(i => {
        const quantityToPay = i.selectedQty!;
        if (quantityToPay === i.qty) i.paid = true;
        else i.qty -= quantityToPay;
        i.selected = false;
        i.selectedQty = 0;
      });
      const allPaid = table.orderItems.every(i => i.paid);
      if (allPaid) {
        this.flashSuccess(this.translate.translate('worker.tables.allItemsPaidClear', { change: changeAmt.toFixed(2) }));
        this.closePayment();
        table.status = 'Cleaning';
        table.since = undefined;
      } else {
        this.flashSuccess(`Partial payment confirmed. Change: ${changeAmt.toFixed(2)} TND`);
        this.amountGiven = null;
      }
      return;
    }

    this.paying = true;
    this.orderService.payOrder(table.activeOrderId, { paymentType: 'split', items: selectedItems }).subscribe({
      next: (updatedOrder) => {
        this.paying = false;
        const allPaid = updatedOrder.status === 'Completed';
        if (allPaid) {
        this.flashSuccess(this.translate.translate('worker.tables.allItemsPaidClear', { change: changeAmt.toFixed(2) }));
          this.closePayment();
        } else {
        this.flashSuccess(this.translate.translate('worker.tables.partialPaymentConfirm', { change: changeAmt.toFixed(2) }));
          this.amountGiven = null;
        }
        this.loadTables();
      },
      error: (err) => {
        this.paying = false;
        alert(this.translate.translate('worker.tables.splitPaymentError') + ': ' + (err.error?.message || 'Server error'));
      }
    });
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

  // ── Table status actions ──────────────────────────────────────────────────────
  updateStatus(table: TableInfo, newStatus: TableInfo['status']): void {
    this.updatingTableId = table.id;
    this.tableService.updateTableStatus(table.id, newStatus).subscribe({
      next: () => {
        this.updatingTableId = null;
        this.loadTables();
      },
      error: (err) => {
        this.updatingTableId = null;
        console.error('Failed to update table status', err);
      }
    });
  }

  startOrder(table: TableInfo): void {
    this.router.navigate(['/worker/new-order'], { queryParams: { table: table.number } });
  }

  printBill(table: TableInfo): void {
    if (!table.activeOrderId) return;
    this.receiptPrintService.printBill(table.activeOrderId);
  }

  billWasPrinted(table: TableInfo): boolean {
    return !!table.activeOrderId && this.receiptPrintService.wasPrinted(table.activeOrderId);
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
