import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface WorkerModel {
  id: number;
  name: string;
  username: string;
  status: 'Active' | 'Off shift';
  joined: string;
}

export interface CreateWorkerPayload {
  name: string;
  username: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class WorkerService {
  private readonly baseUrl = 'http://localhost:8080/api/admin/workers';

  constructor(private http: HttpClient) {}

  getWorkers(): Observable<WorkerModel[]> {
    return this.http.get<WorkerModel[]>(this.baseUrl);
  }

  addWorker(payload: CreateWorkerPayload): Observable<WorkerModel> {
    return this.http.post<WorkerModel>(this.baseUrl, payload);
  }

  deleteWorker(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
