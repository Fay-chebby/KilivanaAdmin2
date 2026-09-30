import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Buyer, BuyerStatus } from '../models/buyer.model';

@Injectable({ providedIn: 'root' })
export class BuyerService {
  private http = inject(HttpClient);
  private baseUrl = '/api/buyers'; // change to your API url

  getAll(): Observable<Buyer[]> {
    return this.http.get<Buyer[]>(this.baseUrl);
  }

  getById(id: string): Observable<Buyer> {
    return this.http.get<Buyer>(`${this.baseUrl}/${id}`);
  }

  updateStatus(id: string, status: BuyerStatus): Observable<Buyer> {
    return this.http.patch<Buyer>(`${this.baseUrl}/${id}/status`, { status });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
