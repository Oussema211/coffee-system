import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { CustomerService } from '../../../core/customer.service';
import { MenuItem } from '../../../core/menu.service';
import { TranslationService } from '../../../core/translation.service';

interface CartItem extends MenuItem { quantity: number; }

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
  cart = new Map<number, CartItem>();
  orderSent = false;
  submitting = false;
  orderId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private customerService: CustomerService,
    private translate: TranslationService
  ) {}

  ngOnInit(): void {
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

  quantity(item: MenuItem): number { return this.cart.get(item.id)?.quantity ?? 0; }
  get filteredMenu(): MenuItem[] {
    const search = this.searchQuery.trim().toLowerCase();
    return this.menu.filter(item => {
      const matchesCategory = this.activeCategory === 'All' || item.category === this.activeCategory;
      const matchesSearch = !search || item.name.toLowerCase().includes(search) || item.category.toLowerCase().includes(search);
      return matchesCategory && matchesSearch;
    });
  }
  add(item: MenuItem): void {
    const current = this.cart.get(item.id);
    this.cart.set(item.id, { ...item, quantity: (current?.quantity ?? 0) + 1 });
  }
  remove(item: MenuItem): void {
    const current = this.cart.get(item.id);
    if (!current) return;
    if (current.quantity === 1) this.cart.delete(item.id);
    else this.cart.set(item.id, { ...current, quantity: current.quantity - 1 });
  }
  get cartItems(): CartItem[] { return Array.from(this.cart.values()); }
  get itemCount(): number { return this.cartItems.reduce((sum, item) => sum + item.quantity, 0); }
  get total(): number { return this.cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0); }

  confirmOrder(): void {
    if (!this.cart.size || this.submitting) return;
    this.submitting = true;
    this.error = '';
    this.customerService.placeOrder({
      orderType: 'QR', tableNumber: this.tableNumber,
      items: this.cartItems.map(item => ({ menuItemId: item.id, quantity: item.quantity }))
    }).subscribe({
      next: (order) => { this.orderId = order.id; this.orderSent = true; this.cart.clear(); this.submitting = false; },
      error: (err) => { this.error = err?.error?.error ?? this.translate.translate('customer.orderError'); this.submitting = false; }
    });
  }
}
