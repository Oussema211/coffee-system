import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { resolveImageUrl } from './utils/image-url.util';

export interface MenuSize {
  name: string;
  priceDelta: number;
}

export interface MenuItem {
  id: number;
  name: string;
  category: string;
  categoryId?: number;
  price: number;
  vatRate?: number;
  available: boolean;
  imageUrl?: string;
  hasSizes?: boolean;
  hasSugar?: boolean;
  hasExtraShot?: boolean;
  extraShotPrice?: number;
  sizes?: MenuSize[];
}

export interface CreateMenuItemPayload {
  name: string;
  category: string;
  price: number;
  vatRate?: number;
  available?: boolean;
  imageUrl?: string;
  hasSizes?: boolean;
  hasSugar?: boolean;
  hasExtraShot?: boolean;
  extraShotPrice?: number;
  sizes?: MenuSize[];
}

export interface UpdateMenuItemPayload {
  name: string;
  category: string;
  price: number;
  vatRate?: number;
  available?: boolean;
  imageUrl?: string;
  hasSizes?: boolean;
  hasSugar?: boolean;
  hasExtraShot?: boolean;
  extraShotPrice?: number;
  sizes?: MenuSize[];
}

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly baseUrl = `${environment.apiUrl}/api/admin/menu`;
  private readonly workerUrl = `${environment.apiUrl}/api/worker/menu`;

  constructor(private http: HttpClient) {}

  private mapItem(item: MenuItem): MenuItem {
    return {
      ...item,
      imageUrl: resolveImageUrl(item.imageUrl)
    };
  }

  getMenuItems(): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(this.baseUrl).pipe(
      map(items => items.map(i => this.mapItem(i)))
    );
  }

  getWorkerMenuItems(): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(this.workerUrl).pipe(
      map(items => items.map(i => this.mapItem(i)))
    );
  }

  getMenuItemById(id: number): Observable<MenuItem> {
    return this.http.get<MenuItem>(`${this.baseUrl}/${id}`).pipe(
      map(item => this.mapItem(item))
    );
  }

  uploadImage(file: File): Observable<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ imageUrl: string }>(`${this.baseUrl}/upload-image`, formData).pipe(
      map(res => ({ imageUrl: resolveImageUrl(res.imageUrl) }))
    );
  }

  createMenuItem(payload: CreateMenuItemPayload): Observable<MenuItem> {
    return this.http.post<MenuItem>(this.baseUrl, payload).pipe(
      map(item => this.mapItem(item))
    );
  }

  updateMenuItem(id: number, payload: UpdateMenuItemPayload): Observable<MenuItem> {
    return this.http.put<MenuItem>(`${this.baseUrl}/${id}`, payload).pipe(
      map(item => this.mapItem(item))
    );
  }

  toggleWorkerAvailability(id: number): Observable<MenuItem> {
    return this.http.patch<MenuItem>(`${this.workerUrl}/${id}/toggle`, {}).pipe(
      map(item => this.mapItem(item))
    );
  }

  deleteMenuItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
