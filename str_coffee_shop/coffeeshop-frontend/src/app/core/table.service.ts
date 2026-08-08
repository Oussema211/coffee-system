import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TableItem {
  id: number;
  number: number;
  seats: number;
  status: string;
}

export interface CreateTablePayload {
  number: number;
  seats: number;
}

@Injectable({ providedIn: 'root' })
export class TableService {
  private readonly adminUrl = 'http://localhost:8080/api/admin/tables';
  private readonly workerUrl = 'http://localhost:8080/api/worker/tables';

  constructor(private http: HttpClient) {}

  /** Admin — list all tables */
  getAdminTables(): Observable<TableItem[]> {
    return this.http.get<TableItem[]>(this.adminUrl);
  }

  /** Admin — create a new table */
  createTable(payload: CreateTablePayload): Observable<TableItem> {
    return this.http.post<TableItem>(this.adminUrl, payload);
  }

  /** Admin — delete a table */
  deleteTable(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminUrl}/${id}`);
  }

  /** Worker — list all tables (read-only) */
  getWorkerTables(): Observable<TableItem[]> {
    return this.http.get<TableItem[]>(this.workerUrl);
  }
}
