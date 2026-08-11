import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface WorkerModel {
  id: number;
  name: string;
  username: string;
  status: 'Active' | 'Checked in' | 'Off shift';
  joined: string;
}

export interface WorkerReport extends WorkerModel {
  lastCheckIn: string | null;
  lastCheckOut: string | null;
  ordersSold: number;
  salesTotal: number;
}

export interface ShiftReport {
  id: number;
  workerName: string;
  username: string;
  checkInAt: string;
  checkOutAt: string | null;
}

export interface CreateWorkerPayload {
  name: string;
  username: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class WorkerService {
  private readonly baseUrl = `${environment.apiUrl}/api/admin/workers`;

  constructor(private http: HttpClient) {}

  getWorkers(): Observable<WorkerModel[]> {
    return this.http.get<WorkerModel[]>(this.baseUrl);
  }

  getWorkerReport(): Observable<WorkerReport[]> {
    return this.http.get<WorkerReport[]>(`${this.baseUrl}/report`);
  }

  getShiftReports(): Observable<ShiftReport[]> {
    return this.http.get<ShiftReport[]>(`${this.baseUrl}/shifts`);
  }

  deleteShiftsOlderThanSevenDays(): Observable<{ deletedCount: number }> {
    return this.http.delete<{ deletedCount: number }>(`${this.baseUrl}/shifts/older-than-seven-days`);
  }

  addWorker(payload: CreateWorkerPayload): Observable<WorkerModel> {
    return this.http.post<WorkerModel>(this.baseUrl, payload);
  }

  deleteWorker(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
