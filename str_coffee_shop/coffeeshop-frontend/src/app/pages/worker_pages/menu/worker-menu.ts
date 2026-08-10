import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuItem, MenuService } from '../../../core/menu.service';

type AvailabilityFilter = 'all' | 'available' | 'hidden';

@Component({
  selector: 'app-worker-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './worker-menu.html'
})
export class WorkerMenuComponent implements OnInit {
  items: MenuItem[] = [];
  loading = true;
  errorMessage = '';
  changingId: number | null = null;
  categories: string[] = ['All'];
  selectedCategory = 'All';
  availabilityFilter: AvailabilityFilter = 'all';
  searchQuery = '';

  constructor(private menuService: MenuService) {}

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.loading = true;
    this.errorMessage = '';
    this.menuService.getWorkerMenuItems().subscribe({
      next: (items) => {
        this.items = items;
        this.categories = ['All', ...Array.from(new Set(items.map(item => item.category))).filter(Boolean)];
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load menu items.';
        this.loading = false;
      }
    });
  }

  get filteredItems(): MenuItem[] {
    const query = this.searchQuery.trim().toLowerCase();
    return this.items.filter(item => {
      const matchesCategory = this.selectedCategory === 'All' || item.category === this.selectedCategory;
      const matchesAvailability = this.availabilityFilter === 'all'
        || (this.availabilityFilter === 'available' && item.available)
        || (this.availabilityFilter === 'hidden' && !item.available);
      const matchesSearch = !query
        || item.name.toLowerCase().includes(query)
        || item.category.toLowerCase().includes(query);
      return matchesCategory && matchesAvailability && matchesSearch;
    });
  }

  toggleAvailability(item: MenuItem): void {
    if (this.changingId !== null) return;
    this.changingId = item.id;
    this.menuService.toggleWorkerAvailability(item.id).subscribe({
      next: (updated) => {
        item.available = updated.available;
        this.changingId = null;
      },
      error: () => {
        this.errorMessage = `Could not update ${item.name}.`;
        this.changingId = null;
      }
    });
  }
}
