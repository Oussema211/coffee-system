import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { CustomerService } from '../../../core/customer.service';
import { MenuItem } from '../../../core/menu.service';
import { TranslationService } from '../../../core/translation.service';

interface CartItem extends MenuItem {
  quantity: number;
  size?: string;
  sugar?: string;
  extraShots?: number;
  lineKey: string;
}

import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { LanguageSwitcherComponent } from '../../../core/components/language-switcher/language-switcher';
import { LoadingComponent } from '../../../core/components/loading/loading';

@Component({
  selector: 'app-customer-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, LanguageSwitcherComponent, LoadingComponent],
  templateUrl: './customer-menu.html',
  styleUrl: './customer-menu.css'
})
export class CustomerMenuComponent implements OnInit {
  tableNumber = 0;
  tableValid = false;
  loading = true;
  error = '';
  menu: MenuItem[] = [];
  categories: string[] = ['All'];
  activeCategory = 'All';
  searchQuery = '';
  cart = new Map<string, CartItem>();
  orderSent = false;
  submitting = false;
  orderId: number | null = null;
  cartOpen = false;

  // Modifier selection modal state
  modalItem: MenuItem | null = null;
  modalSize = '';
  modalSugar = '';
  modalExtraShots = 0;
  sugarOptions: { label: string }[] = [];

  constructor(
    private route: ActivatedRoute,
    private customerService: CustomerService,
    private translate: TranslationService
  ) {}

  ngOnInit(): void {
    this.sugarOptions = [
      { label: this.translate.translate('customer.sugarNone') },
      { label: this.translate.translate('customer.sugarLow') },
      { label: this.translate.translate('customer.sugarNormal') },
      { label: this.translate.translate('customer.sugarExtra') }
    ];
    this.tableNumber = Number(this.route.snapshot.paramMap.get('tableNumber'));
    if (!Number.isInteger(this.tableNumber) || this.tableNumber < 1) {
      this.loading = false;
      this.error = this.translate.translate('customer.invalidTable');
      return;
    }
    forkJoin({ table: this.customerService.getTable(this.tableNumber), menu: this.customerService.getMenu() }).subscribe({
      next: ({ menu }) => {
        this.tableValid = true;
        this.menu = menu;
        this.categories = ['All', ...Array.from(new Set(menu.map(item => item.category))).filter(Boolean)];
        this.loading = false;
      },
      error: () => { this.error = this.translate.translate('customer.unavailableTable'); this.loading = false; }
    });
  }

  hasModifiers(item: MenuItem): boolean {
    return !!(item.hasSizes || item.hasSugar || item.hasExtraShot);
  }

  lineKey(item: MenuItem, size: string, sugar: string, extraShots: number): string {
    return `${item.id}|${size ?? ''}|${sugar ?? ''}|${extraShots ?? 0}`;
  }

  quantity(item: MenuItem): number {
    const prefix = `${item.id}|`;
    let total = 0;
    this.cart.forEach((line) => { if (line.lineKey.startsWith(prefix)) total += line.quantity; });
    return total;
  }

  get filteredMenu(): MenuItem[] {
    const search = this.searchQuery.trim().toLowerCase();
    return this.menu.filter(item => {
      const matchesCategory = this.activeCategory === 'All' || item.category === this.activeCategory;
      const matchesSearch = !search || item.name.toLowerCase().includes(search) || item.category.toLowerCase().includes(search);
      return matchesCategory && matchesSearch;
    });
  }

  add(item: MenuItem): void {
    if (this.hasModifiers(item)) {
      this.openModifiers(item);
    } else {
      this.addLine(this.lineKey(item, '', '', 0));
    }
  }

  remove(item: MenuItem): void {
    const key = this.lineKey(item, '', '', 0);
    this.decrementLine(key);
  }

  addLine(key: string): void {
    const current = this.cart.get(key);
    if (current) {
      current.quantity++;
      this.cart.set(key, current);
    } else {
      const source = this.menu.find(i => i.id === Number(key.split('|')[0]));
      if (!source) return;
      const [, size, sugar, extraShots] = key.split('|');
      this.cart.set(key, {
        ...source,
        quantity: 1,
        size: size || undefined,
        sugar: sugar || undefined,
        extraShots: Number(extraShots) || 0,
        lineKey: key
      });
    }
  }

  decrementLine(key: string): void {
    const current = this.cart.get(key);
    if (!current) return;
    if (current.quantity === 1) this.cart.delete(key);
    else this.cart.set(key, { ...current, quantity: current.quantity - 1 });
  }

  unitPrice(line: CartItem): number {
    let price = Number(line.price);
    const sizeDelta = line.sizes?.find(s => s.name === line.size)?.priceDelta ?? 0;
    price += Number(sizeDelta);
    if (line.extraShots) {
      price += Number(line.extraShots) * Number(line.extraShotPrice ?? 0);
    }
    return price;
  }

  lineTotal(line: CartItem): number {
    return this.unitPrice(line) * line.quantity;
  }

  modsLabel(line: CartItem): string {
    const parts: string[] = [];
    if (line.size) parts.push(line.size);
    if (line.sugar) parts.push(line.sugar);
    if (line.extraShots) parts.push('+' + line.extraShots + ' shot');
    return parts.join(' · ');
  }

  get cartItems(): CartItem[] { return Array.from(this.cart.values()); }
  get itemCount(): number { return this.cartItems.reduce((sum, item) => sum + item.quantity, 0); }
  get total(): number { return this.cartItems.reduce((sum, item) => sum + this.lineTotal(item), 0); }

  toggleCart(): void { this.cartOpen = !this.cartOpen; }
  closeCart(): void { this.cartOpen = false; }

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
    const key = this.lineKey(this.modalItem, this.modalSize, this.modalSugar, this.modalExtraShots);
    this.addLine(key);
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

  confirmOrder(): void {
    if (!this.cart.size || this.submitting) return;
    this.submitting = true;
    this.error = '';
    this.customerService.placeOrder({
      orderType: 'QR', tableNumber: this.tableNumber,
      items: this.cartItems.map(item => ({
        menuItemId: item.id,
        quantity: item.quantity,
        size: item.size || undefined,
        sugar: item.sugar || undefined,
        extraShots: item.extraShots || 0
      }))
    }).subscribe({
      next: (order) => { this.orderId = order.id; this.orderSent = true; this.cart.clear(); this.submitting = false; this.cartOpen = false; },
      error: (err) => { this.error = err?.error?.error ?? this.translate.translate('customer.orderError'); this.submitting = false; }
    });
  }
}
