import { Injectable } from '@angular/core';
import { delay, Observable, of, throwError } from 'rxjs';
import { Buyer, BuyerStatus } from '../models/buyer.model';

@Injectable({ providedIn: 'root' })
export class BuyerService {
  private buyers: Buyer[] = [
    {
      id: '1',
      code: 'B-001',
      name: 'AgriMart Ltd',
      email: 'procurement@agrimart.com',
      phone: '+233 24 123 4567',
      address: '12 Independence Ave, Accra',
      type: 'corporate',
      region: 'Greater Accra',
      status: 'verified',
      ordersCount: 142,
      totalSpend: 284000,
      disputesCount: 2,
      createdAt: '2024-02-14T09:30:00Z',
    },
    {
      id: '2',
      code: 'B-002',
      name: 'Kofi Agyeman',
      email: 'kofi.agyeman@gmail.com',
      phone: '+233 20 987 6543',
      address: 'Adum, Kumasi',
      type: 'individual',
      region: 'Ashanti',
      status: 'verified',
      ordersCount: 18,
      totalSpend: 4200,
      disputesCount: 0,
      createdAt: '2024-05-02T11:15:00Z',
    },
    {
      id: '3',
      code: 'B-003',
      name: 'FreshPak Exports',
      email: 'ops@freshpak.gh',
      phone: '+233 30 555 0101',
      address: 'Koforidua Industrial Area',
      type: 'corporate',
      region: 'Eastern',
      status: 'pending',
      ordersCount: 3,
      totalSpend: 21000,
      disputesCount: 0,
      createdAt: '2025-01-20T14:00:00Z',
    },
    {
      id: '4',
      code: 'B-004',
      name: 'Mercy Tetteh',
      email: 'mercy.tetteh@mail.com',
      phone: '+233 55 222 3344',
      address: 'Ho Market Road',
      type: 'individual',
      region: 'Volta',
      status: 'suspended',
      ordersCount: 7,
      totalSpend: 1800,
      disputesCount: 3,
      createdAt: '2024-09-08T08:45:00Z',
    },
    {
      id: '5',
      code: 'B-005',
      name: 'Ghana Foods Co.',
      email: 'buying@ghanafoods.com',
      phone: '+233 24 777 8899',
      address: 'Tema Community 1',
      type: 'corporate',
      region: 'Greater Accra',
      status: 'verified',
      ordersCount: 89,
      totalSpend: 156000,
      disputesCount: 1,
      createdAt: '2024-03-30T10:00:00Z',
    },
  ];

  getAll(): Observable<Buyer[]> {
    return of([...this.buyers]).pipe(delay(400));
  }

  getById(id: string): Observable<Buyer> {
    const buyer = this.buyers.find((b) => b.id === id);
    return buyer
      ? of({ ...buyer }).pipe(delay(300))
      : throwError(() => new Error('Buyer not found'));
  }

  updateStatus(id: string, status: BuyerStatus): Observable<Buyer> {
    const index = this.buyers.findIndex((b) => b.id === id);
    if (index === -1) return throwError(() => new Error('Buyer not found'));

    this.buyers[index] = { ...this.buyers[index], status };
    return of({ ...this.buyers[index] }).pipe(delay(300));
  }

  delete(id: string): Observable<void> {
    this.buyers = this.buyers.filter((b) => b.id !== id);
    return of(void 0).pipe(delay(300));
  }
}
