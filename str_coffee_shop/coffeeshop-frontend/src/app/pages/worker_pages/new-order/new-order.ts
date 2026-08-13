import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { MenuItem, MenuService } from '../../../core/menu.service';
import { TableService, TableItem } from '../../../core/table.service';
import { OrderService, CreateOrderRequest } from '../../../core/order.service';
import { TranslationService } from '../../../core/translation.service';

interface CartLine {
  item: MenuItem;
  qty: number;
  key: string;
  size?: string;
  sugar?: string;
  extraShots?: number;
}

import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { LoadingComponent } from '../../../core/components/loading/loading';

@Component({
  selector: 'app-new-order',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, LoadingComponent],
  templateUrl: './new-order.html',
  styleUrl: './new-order.css'
})
export class NewOrderComponent implements OnInit {
  categories: string[] = ['All'];
  activeCategory = 'All';
  searchQuery = '';

  menuItems: MenuItem[] = [];
  menuLoading = true;
  menuError = '';

  cart: CartLine[] = [];
  orderType: 'Dine-in' | 'Takeaway' = 'Dine-in';
  selectedTable: number | null = null;
  tables: TableItem[] = [];
  tablesLoading = true;
  tablesError = '';

  placing = false;
  placedMessage = '';

  // Modifier selection modal state
  modalItem: MenuItem | null = null;
  modalSize = '';
  modalSugar = '';
  modalExtraShots = 0;
  sugarOptions: { label: string }[] = [];

  constructor(
    private route: ActivatedRoute,
    private tableService: TableService,
    private menuService: MenuService,
    private orderService: OrderService,
    private translate: TranslationService
  ) {
    // If we arrived here from a table card ("Start order"), preselect that table.
    const tableParam = this.route.snapshot.queryParamMap.get('table');
    if (tableParam) {
      this.selectedTable = Number(tableParam);
      this.orderType = 'Dine-in';
    }
  }

  ngOnInit(): void {
    this.sugarOptions = [
      { label: this.translate.translate('customer.sugarNone') },
      { label: this.translate.translate('customer.sugarLow') },
      { label: this.translate.translate('customer.sugarNormal') },
      { label: this.translate.translate('customer.sugarExtra') }
    ];
    this.tableService.getWorkerTables().subscribe({
      next: (data) => {
        this.tables = data;
        this.tablesLoading = false;
      },
      error: () => {
        this.tablesError = this.translate.translate('worker.pos.tablesLoadError');
        this.tablesLoading = false;
      }
    });

    this.menuService.getWorkerMenuItems().subscribe({
      next: (data) => {
        this.menuItems = data;
        const dynamicCats = Array.from(new Set(data.map(i => i.category))).filter(Boolean);
        this.categories = ['All', ...dynamicCats];
        this.menuLoading = false;
      },
      error: () => {
        this.menuError = this.translate.translate('worker.pos.menuLoadError');
        this.menuLoading = false;
      }
    });
  }

  get filteredItems(): MenuItem[] {
    const q = this.searchQuery.trim().toLowerCase();
    return this.menuItems.filter(i => {
      if (!i.available) return false;
      const matchesCategory = this.activeCategory === 'All' || i.category === this.activeCategory;
      const matchesSearch = !q || i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }

  hasModifiers(item: MenuItem): boolean {
    return !!(item.hasSizes || item.hasSugar || item.hasExtraShot);
  }

  unitPrice(line: CartLine): number {
    let price = Number(line.item.price);
    const sizeDelta = line.item.sizes?.find(s => s.name === line.size)?.priceDelta ?? 0;
    price += Number(sizeDelta);
    if (line.extraShots) {
      price += Number(line.extraShots) * Number(line.item.extraShotPrice ?? 0);
    }
    return price;
  }

  get cartTotal(): number {
    return this.cart.reduce((sum, line) => sum + this.unitPrice(line) * line.qty, 0);
  }

  get cartCount(): number {
    return this.cart.reduce((sum, line) => sum + line.qty, 0);
  }

  get canPlaceOrder(): boolean {
    if (this.cart.length === 0) return false;
    if (this.orderType === 'Dine-in' && !this.selectedTable) return false;
    return true;
  }

  lineKey(item: MenuItem, size: string, sugar: string, extraShots: number): string {
    return `${item.id}|${size ?? ''}|${sugar ?? ''}|${extraShots ?? 0}`;
  }

  addToCart(item: MenuItem): void {
    if (this.hasModifiers(item)) {
      this.openModifiers(item);
      return;
    }
    this.addLine(this.lineKey(item, '', '', 0));
  }

  addLine(key: string): void {
    const line = this.cart.find(l => l.key === key);
    if (line) {
      line.qty++;
      return;
    }
    const [, size, sugar, extraShots] = key.split('|');
    const item = this.menuItems.find(i => i.id === Number(key.split('|')[0]));
    if (!item) return;
    this.cart.push({
      item,
      qty: 1,
      key,
      size: size || undefined,
      sugar: sugar || undefined,
      extraShots: Number(extraShots) || 0
    });
  }

  increment(key: string): void {
    const line = this.cart.find(l => l.key === key);
    if (line) line.qty++;
  }

  decrement(key: string): void {
    const line = this.cart.find(l => l.key === key);
    if (!line) return;
    line.qty--;
    if (line.qty <= 0) {
      this.cart = this.cart.filter(l => l !== line);
    }
  }

  modsLabel(line: CartLine): string {
    const parts: string[] = [];
    if (line.size) parts.push(line.size);
    if (line.sugar) parts.push(line.sugar);
    if (line.extraShots) parts.push('+' + line.extraShots + ' shot');
    return parts.join(' · ');
  }

  clearCart(): void {
    this.cart = [];
  }

  openModifiers(item: MenuItem): void {
    this.modalItem = item;
    this.modalSize = item.hasSizes ? (item.sizes?.[0]?.name ?? '') : '';
    this.modalSugar = item.hasSugar ? this.sugarOptions[2].label : '';
    this.modalExtraShots = 0;
  }

  closeModifiers(): void {
    this.modalItem = null;
  }

  confirmModifiers(): void {
    if (!this.modalItem) return;
    this.addLine(this.lineKey(this.modalItem, this.modalSize, this.modalSugar, this.modalExtraShots));
    this.closeModifiers();
  }

  get modalTotal(): number {
    const item = this.modalItem;
    if (!item) return 0;
    let price = Number(item.price);
    const sizeDelta = item.sizes?.find(s => s.name === this.modalSize)?.priceDelta ?? 0;
    price += Number(sizeDelta);
    if (item.hasExtraShot) {
      price += this.modalExtraShots * Number(item.extraShotPrice ?? 0);
    }
    return price;
  }

  placeOrder(): void {
    if (!this.canPlaceOrder) return;

    this.placing = true;
    const payload: CreateOrderRequest = {
      orderType: this.orderType,
      tableNumber: this.orderType === 'Dine-in' ? this.selectedTable : null,
      items: this.cart.map(line => ({
        menuItemId: line.item.id,
        quantity: line.qty,
        size: line.size || undefined,
        sugar: line.sugar || undefined,
        extraShots: line.extraShots || 0
      }))
    };

    this.orderService.createOrder(payload).subscribe({
      next: (createdOrder) => {
        this.placing = false;
        this.placedMessage =
          this.orderType === 'Dine-in'
            ? this.translate.translate('worker.pos.orderSuccessDine', { id: createdOrder.id, table: this.selectedTable })
            : this.translate.translate('worker.pos.orderSuccessTakeaway', { id: createdOrder.id });
        this.clearCart();
        this.selectedTable = null;
        setTimeout(() => (this.placedMessage = ''), 3500);
      },
      error: (err) => {
        this.placing = false;
        this.placedMessage = this.translate.translate('worker.pos.orderError') + ': ' + (err.error?.message || 'Server error');
        setTimeout(() => (this.placedMessage = ''), 3500);
      }
    });
  }
}