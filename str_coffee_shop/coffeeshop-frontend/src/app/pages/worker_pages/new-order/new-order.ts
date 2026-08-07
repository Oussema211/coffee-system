import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { MenuItem } from '../../../core/menu.service';

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
export class NewOrderComponent {
  categories = ['All', 'Coffee', 'Pastry', 'Cold Drinks', 'Tea'];
  activeCategory = 'All';

  menuItems: MenuItem[] = [
    { id: 1, name: 'Espresso', category: 'Coffee', price: 2.5, available: true },
    { id: 2, name: 'Cappuccino', category: 'Coffee', price: 3.5, available: true },
    { id: 3, name: 'Latte', category: 'Coffee', price: 3.8, available: true },
    { id: 4, name: 'Iced Americano', category: 'Cold Drinks', price: 3.0, available: true },
    { id: 5, name: 'Croissant', category: 'Pastry', price: 2.2, available: true },
    { id: 6, name: 'Blueberry Muffin', category: 'Pastry', price: 2.8, available: true },
  ];

  cart: CartLine[] = [];
  orderType: 'Dine-in' | 'Takeaway' = 'Dine-in';
  selectedTable: number | null = null;
  tables = [1, 2, 3, 4, 5, 6, 7, 8];

  placing = false;
  placedMessage = '';

  constructor(route: ActivatedRoute) {
    // If we arrived here from a table card ("Start order"), preselect that table.
    const tableParam = route.snapshot.queryParamMap.get('table');
    if (tableParam) {
      this.selectedTable = Number(tableParam);
      this.orderType = 'Dine-in';
    }
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