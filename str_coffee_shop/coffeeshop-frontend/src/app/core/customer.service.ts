import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MenuItem } from './menu.service';
import { CreateOrderRequest, OrderDTO } from './order.service';
import { TableItem } from './table.service';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  // Use the same host as the QR page so a phone on the local network can
  // reach the backend too (instead of trying to call localhost on the phone).
  private readonly baseUrl = window.location.protocol + '//' + window.location.hostname + ':8080/api/public';

  constructor(private http: HttpClient) {}

  getTable(tableNumber: number): Observable<TableItem> {
    return this.http.get<TableItem>(`${this.baseUrl}/tables/${tableNumber}`);
  }

  getMenu(): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(`${this.baseUrl}/menu`);
  }

  placeOrder(payload: CreateOrderRequest): Observable<OrderDTO> {
    return this.http.post<OrderDTO>(`${this.baseUrl}/orders`, payload);
  }
}
