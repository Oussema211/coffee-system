import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderDTO, OrderService } from '../../../core/order.service';
import { TranslationService } from '../../../core/translation.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { LoadingComponent } from '../../../core/components/loading/loading';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, TranslatePipe, LoadingComponent],
  templateUrl: './orders.html'
})
export class Orders implements OnInit {
  orders: OrderDTO[] = [];
  loading = false;
  clearing = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private orderService: OrderService,
    private translate: TranslationService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.errorMessage = '';

    this.orderService.getAllOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = this.translate.translate('admin.orders.loadError');
        this.loading = false;
      }
    });
  }

  clearOrdersOlderThanSevenDays(): void {
    const confirmed = confirm(this.translate.translate('admin.orders.clearConfirm'));
    if (!confirmed) return;

    this.clearing = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.orderService.deleteOrdersOlderThanSevenDays().subscribe({
      next: ({ deletedCount }) => {
        this.successMessage = deletedCount === 1
          ? this.translate.translate('admin.orders.clearSuccess', { count: deletedCount })
          : this.translate.translate('admin.orders.clearSuccessPlural', { count: deletedCount });
        this.clearing = false;
        this.loadOrders();
      },
      error: () => {
        this.errorMessage = this.translate.translate('admin.orders.clearError');
        this.clearing = false;
      }
    });
  }

  get todaysTotal(): number {
    return this.orders
      .filter(order => !['Cancelled'].includes(order.status))
      .reduce((sum, order) => sum + Number(order.total), 0);
  }

  statusClass(status: OrderDTO['status']): string {
    if (status === 'Completed' || status === 'Served') return 'bg-sage/15 text-sage';
    if (status === 'Cancelled') return 'bg-red-50 text-red-500';
    return 'bg-amber-50 text-amber-700';
  }
}
