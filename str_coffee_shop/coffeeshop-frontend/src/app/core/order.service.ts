import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OrderItemDTO {
  id?: number;
  menuItemId: number;
  name: string;
  price: number;
  qty: number;
  paid: boolean;
  selected?: boolean;
}

export interface OrderDTO {
  id: number;
  table: number | null;
  type: 'Dine-in' | 'Takeaway' | 'QR';
  items: string[];
  orderItems: OrderItemDTO[];
  total: number;
  time: string;
  workerName: string | null;
  status: 'Pending' | 'Preparing' | 'Ready' | 'Served' | 'Completed' | 'Cancelled';
}

export interface CreateOrderItemRequest {
  menuItemId: number;
  quantity: number;
}

export interface CreateOrderRequest {
  orderType: string;
  tableNumber?: number | null;
  items: CreateOrderItemRequest[];
}

export interface PaymentRequest {
  paymentType: 'full' | 'split';
  itemIds?: number[];
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly baseUrl = 'http://localhost:8080/api/worker/orders';
  private readonly adminBaseUrl = 'http://localhost:8080/api/admin/orders';

  constructor(private http: HttpClient) {}

  createOrder(payload: CreateOrderRequest): Observable<OrderDTO> {
    return this.http.post<OrderDTO>(this.baseUrl, payload);
  }

  getActiveOrders(): Observable<OrderDTO[]> {
    return this.http.get<OrderDTO[]>(this.baseUrl);
  }

  getAllOrders(): Observable<OrderDTO[]> {
    return this.http.get<OrderDTO[]>(`${this.baseUrl}/all`);
  }

  deleteOrdersOlderThanSevenDays(): Observable<{ deletedCount: number }> {
    return this.http.delete<{ deletedCount: number }>(`${this.adminBaseUrl}/older-than-seven-days`);
  }

  getPendingQrOrders(): Observable<OrderDTO[]> {
    return this.http.get<OrderDTO[]>(`${this.baseUrl}/qr-pending`);
  }

  updateOrderStatus(orderId: number, status: string): Observable<OrderDTO> {
    return this.http.patch<OrderDTO>(`${this.baseUrl}/${orderId}/status`, { status });
  }

  cancelOrder(orderId: number): Observable<OrderDTO> {
    return this.http.patch<OrderDTO>(`${this.baseUrl}/${orderId}/cancel`, {});
  }

  payOrder(orderId: number, payload: PaymentRequest): Observable<OrderDTO> {
    return this.http.post<OrderDTO>(`${this.baseUrl}/${orderId}/pay`, payload);
  }
}
