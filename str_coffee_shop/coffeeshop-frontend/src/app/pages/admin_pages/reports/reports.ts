import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DailySales, TopItem, ZReportData } from '../../../core/dashboard.service';
import { TranslationService } from '../../../core/translation.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { LoadingComponent } from '../../../core/components/loading/loading';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, TranslatePipe, LoadingComponent],
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

  zReport: ZReportData | null = null;

  constructor(
    private dashboardService: DashboardService,
    private translate: TranslationService
  ) {}

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
        this.errorMessage = this.translate.translate('admin.reports.loadError');
        this.loading = false;
      }
    });

    this.dashboardService.getZReport().subscribe({
      next: (data) => { this.zReport = data; },
      error: () => { this.zReport = null; }
    });
  }

  get maxSales(): number {
    return Math.max(1, ...this.weekSales.map(d => Number(d.amount)));
  }

  barHeight(amount: number): number {
    return Math.round((Number(amount) / this.maxSales) * 100);
  }
}
