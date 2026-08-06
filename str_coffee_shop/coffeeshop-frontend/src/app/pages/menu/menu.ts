import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
  available: boolean;
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './menu.html'
})
export class Menu {
  items: MenuItem[] = [
    { id: 1, name: 'Espresso', category: 'Coffee', price: 2.5, available: true },
    { id: 2, name: 'Cappuccino', category: 'Coffee', price: 3.5, available: true },
    { id: 3, name: 'Latte', category: 'Coffee', price: 3.8, available: true },
    { id: 4, name: 'Iced Americano', category: 'Coffee', price: 3.0, available: false },
    { id: 5, name: 'Croissant', category: 'Pastry', price: 2.2, available: true },
    { id: 6, name: 'Blueberry Muffin', category: 'Pastry', price: 2.8, available: true }
  ];

  categories = ['Coffee', 'Pastry', 'Cold Drinks', 'Tea'];

  showModal = false;
  editingItem: MenuItem | null = null;
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      category: ['Coffee', Validators.required],
      price: [0, [Validators.required, Validators.min(0.1)]]
    });
  }

  openAddModal(): void {
    this.editingItem = null;
    this.form.reset({ name: '', category: 'Coffee', price: 0 });
    this.showModal = true;
  }

  openEditModal(item: MenuItem): void {
    this.editingItem = item;
    this.form.reset({ name: item.name, category: item.category, price: item.price });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveItem(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.value;

    if (this.editingItem) {
      this.editingItem.name = value.name;
      this.editingItem.category = value.category;
      this.editingItem.price = value.price;
    } else {
      this.items.push({
        id: Math.max(0, ...this.items.map(i => i.id)) + 1,
        name: value.name,
        category: value.category,
        price: value.price,
        available: true
      });
    }
    this.closeModal();
  }

  toggleAvailability(item: MenuItem): void {
    item.available = !item.available;
  }

  deleteItem(item: MenuItem): void {
    this.items = this.items.filter(i => i.id !== item.id);
  }
}