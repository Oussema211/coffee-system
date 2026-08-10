import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DailySales, TopItem } from '../../../core/dashboard.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.html'
})
export class Reports implements OnInit {
  weekSales: DailySales[] = [];
  topItems: TopItem[] = [];
  weekTotal = 0;
  averageOrderValue = 0;
  bestSeller = '—';
  loading = true;
  errorMessage = '';

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.dashboardService.getReports().subscribe({
      next: (data) => {
        this.weekSales = data.weekSales;
        this.topItems = data.topItems;
        this.weekTotal = Number(data.weekTotal);
        this.averageOrderValue = Number(data.averageOrderValue);
        this.bestSeller = data.bestSeller;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load report data. Please try again.';
        this.loading = false;
      }
    });
  }

  get maxSales(): number {
    return Math.max(1, ...this.weekSales.map(d => Number(d.amount)));
  }

  barHeight(amount: number): number {
    return Math.round((Number(amount) / this.maxSales) * 100);
  }
}
