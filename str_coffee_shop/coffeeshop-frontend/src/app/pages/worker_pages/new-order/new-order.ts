import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { MenuItem, MenuService } from '../../../core/menu.service';
import { TableService, TableItem } from '../../../core/table.service';

interface CartLine {
  item: MenuItem;
  qty: number;
}

@Component({
  selector: 'app-new-order',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './new-order.html',
  styleUrl: './new-order.css'
})
export class NewOrderComponent implements OnInit {
  categories: string[] = ['All'];
  activeCategory = 'All';

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

  constructor(
    private route: ActivatedRoute,
    private tableService: TableService,
    private menuService: MenuService
  ) {
    // If we arrived here from a table card ("Start order"), preselect that table.
    const tableParam = this.route.snapshot.queryParamMap.get('table');
    if (tableParam) {
      this.selectedTable = Number(tableParam);
      this.orderType = 'Dine-in';
    }
  }

  ngOnInit(): void {
    this.tableService.getWorkerTables().subscribe({
      next: (data) => {
        this.tables = data;
        this.tablesLoading = false;
      },
      error: () => {
        this.tablesError = 'Failed to load tables';
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
        this.menuError = 'Failed to load menu from backend.';
        this.menuLoading = false;
      }
    });
  }

  get filteredItems(): MenuItem[] {
    return this.menuItems.filter(
      i => i.available && (this.activeCategory === 'All' || i.category === this.activeCategory)
    );
  }

  get cartTotal(): number {
    return this.cart.reduce((sum, line) => sum + line.item.price * line.qty, 0);
  }

  get cartCount(): number {
    return this.cart.reduce((sum, line) => sum + line.qty, 0);
  }

  get canPlaceOrder(): boolean {
    if (this.cart.length === 0) return false;
    if (this.orderType === 'Dine-in' && !this.selectedTable) return false;
    return true;
  }

  addToCart(item: MenuItem): void {
    const line = this.cart.find(l => l.item.id === item.id);
    if (line) {
      line.qty++;
    } else {
      this.cart.push({ item, qty: 1 });
    }
  }

  increment(line: CartLine): void {
    line.qty++;
  }

  decrement(line: CartLine): void {
    line.qty--;
    if (line.qty <= 0) {
      this.cart = this.cart.filter(l => l !== line);
    }
  }

  clearCart(): void {
    this.cart = [];
  }

  placeOrder(): void {
    if (!this.canPlaceOrder) return;

    this.placing = true;
    setTimeout(() => {
      this.placing = false;
      this.placedMessage =
        this.orderType === 'Dine-in'
          ? `Order sent to the counter — Table ${this.selectedTable}.`
          : 'Takeaway order sent to the counter.';
      this.clearCart();
      this.selectedTable = null;
      setTimeout(() => (this.placedMessage = ''), 3000);
    }, 500);
  }
}