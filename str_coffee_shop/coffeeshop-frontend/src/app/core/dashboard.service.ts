import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AdminDashboardData {
  todaysRevenue: number;
  ordersToday: number;
  pendingOrders: number;
  activeWorkers: number;
  totalWorkers: number;
  menuItems: number;
  unavailableMenuItems: number;
  recentOrders: RecentOrder[];
}

export interface RecentOrder {
  id: number;
  items: string;
  worker: string;
  total: number;
  status: string;
}

export interface AdminReportsData {
  weekTotal: number;
  averageOrderValue: number;
  bestSeller: string;
  weekSales: DailySales[];
  topItems: TopItem[];
}

export interface DailySales {
  day: string;
  amount: number;
}

export interface TopItem {
  name: string;
  sold: number;
}

export interface ZReportData {
  date: string;
  orderCount: number;
  revenue: number;
  revenueExclVat: number;
  totalVat: number;
  vatBreakdown: VatLine[];
}

export interface VatLine {
  rate: number;
  base: number;
  vat: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly baseUrl = `${environment.apiUrl}/api/admin/dashboard`;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<AdminDashboardData> {
    return this.http.get<AdminDashboardData>(this.baseUrl);
  }

  getReports(): Observable<AdminReportsData> {
    return this.http.get<AdminReportsData>(`${this.baseUrl}/reports`);
  }

  getZReport(): Observable<ZReportData> {
    return this.http.get<ZReportData>(`${this.baseUrl}/z-report`);
  }
}
