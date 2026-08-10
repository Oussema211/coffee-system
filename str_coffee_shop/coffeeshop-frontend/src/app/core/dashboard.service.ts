import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly baseUrl = 'http://localhost:8080/api/admin/dashboard';

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<AdminDashboardData> {
    return this.http.get<AdminDashboardData>(this.baseUrl);
  }

  getReports(): Observable<AdminReportsData> {
    return this.http.get<AdminReportsData>(`${this.baseUrl}/reports`);
  }
}
