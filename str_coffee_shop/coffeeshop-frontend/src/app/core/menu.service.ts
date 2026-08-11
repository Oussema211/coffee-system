import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
  available: boolean;
  imageUrl?: string;
}

export interface CreateMenuItemPayload {
  name: string;
  category: string;
  price: number;
  available?: boolean;
  imageUrl?: string;
}

export interface UpdateMenuItemPayload {
  name: string;
  category: string;
  price: number;
  available?: boolean;
  imageUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly baseUrl = `${environment.apiUrl}/api/admin/menu`;
  private readonly workerUrl = `${environment.apiUrl}/api/worker/menu`;

  constructor(private http: HttpClient) {}

  getMenuItems(): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(this.baseUrl);
  }

  getWorkerMenuItems(): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(this.workerUrl);
  }

  getMenuItemById(id: number): Observable<MenuItem> {
    return this.http.get<MenuItem>(`${this.baseUrl}/${id}`);
  }

  uploadImage(file: File): Observable<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ imageUrl: string }>(`${this.baseUrl}/upload-image`, formData);
  }

  createMenuItem(payload: CreateMenuItemPayload): Observable<MenuItem> {
    return this.http.post<MenuItem>(this.baseUrl, payload);
  }

  updateMenuItem(id: number, payload: UpdateMenuItemPayload): Observable<MenuItem> {
    return this.http.put<MenuItem>(`${this.baseUrl}/${id}`, payload);
  }

  toggleWorkerAvailability(id: number): Observable<MenuItem> {
    return this.http.patch<MenuItem>(`${this.workerUrl}/${id}/toggle`, {});
  }

  deleteMenuItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
