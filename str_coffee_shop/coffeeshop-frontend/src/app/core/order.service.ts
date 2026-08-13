import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface OrderItemDTO {
  id?: number;
  menuItemId: number;
  name: string;
  price: number;
  vatRate?: number;
  qty: number;
  paid: boolean;
  selected?: boolean;
  selectedQty?: number;
  size?: string;
  sugar?: string;
}

export interface VatBreakdownLine {
  rate: number;
  base: number;
  vat: number;
  total: number;
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
  workerId?: number | null;
  status: 'Pending' | 'Preparing' | 'Ready' | 'Served' | 'Completed' | 'Cancelled';
}

export interface CreateOrderItemRequest {
  menuItemId: number;
  quantity: number;
  size?: string;
  sugar?: string;
}

export interface CreateOrderRequest {
  orderType: string;
  tableNumber?: number | null;
  items: CreateOrderItemRequest[];
}

export interface PaymentRequest {
  paymentType: 'full' | 'split';
  items?: PaymentItemRequest[];
}

export interface PaymentItemRequest {
  itemId: number;
  quantity: number;
}

export interface ReceiptDTO {
  shopName: string;
  shopMatricule?: string;
  shopAddress?: string;
  shopPhone?: string;
  receiptNumber: string;
  orderId: number;
  tableNumber: number | null;
  orderType: string;
  orderTime: string;
  printedAt: string;
  workerName: string | null;
  status: string;
  items: OrderItemDTO[];
  total: number;
  totalExclVat?: number;
  totalVat?: number;
  vatBreakdown?: VatBreakdownLine[];
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly baseUrl = `${environment.apiUrl}/api/worker/orders`;
  private readonly adminBaseUrl = `${environment.apiUrl}/api/admin/orders`;
  private orderStateChangedSubject = new Subject<void>();
  public orderStateChanged$ = this.orderStateChangedSubject.asObservable();

  constructor(private http: HttpClient) {}

  notifyOrderStateChanged(): void {
    this.orderStateChangedSubject.next();
  }

  createOrder(payload: CreateOrderRequest): Observable<OrderDTO> {
    return this.http.post<OrderDTO>(this.baseUrl, payload).pipe(
      tap(() => this.notifyOrderStateChanged())
    );
  }

  getActiveOrders(): Observable<OrderDTO[]> {
    return this.http.get<OrderDTO[]>(this.baseUrl);
  }

  getAllOrders(): Observable<OrderDTO[]> {
    return this.http.get<OrderDTO[]>(`${this.baseUrl}/all`);
  }

  getReceipt(orderId: number): Observable<ReceiptDTO> {
    return this.http.get<ReceiptDTO>(`${this.baseUrl}/${orderId}/receipt`);
  }

  deleteOrdersOlderThanSevenDays(): Observable<{ deletedCount: number }> {
    return this.http.delete<{ deletedCount: number }>(`${this.adminBaseUrl}/older-than-seven-days`);
  }

  getPendingQrOrders(): Observable<OrderDTO[]> {
    return this.http.get<OrderDTO[]>(`${this.baseUrl}/qr-pending`);
  }

  updateOrderStatus(orderId: number, status: string): Observable<OrderDTO> {
    return this.http.patch<OrderDTO>(`${this.baseUrl}/${orderId}/status`, { status }).pipe(
      tap(() => this.notifyOrderStateChanged())
    );
  }

  cancelOrder(orderId: number): Observable<OrderDTO> {
    return this.http.patch<OrderDTO>(`${this.baseUrl}/${orderId}/cancel`, {}).pipe(
      tap(() => this.notifyOrderStateChanged())
    );
  }

  payOrder(orderId: number, payload: PaymentRequest): Observable<OrderDTO> {
    return this.http.post<OrderDTO>(`${this.baseUrl}/${orderId}/pay`, payload).pipe(
      tap(() => this.notifyOrderStateChanged())
    );
  }
}
