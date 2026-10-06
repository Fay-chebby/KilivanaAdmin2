import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ApiResponse, Buyer, BuyerDto, BuyerStatus, BuyerType } from '../models/buyer.model';

@Injectable({ providedIn: 'root' })
export class BuyerService {
  private http = inject(HttpClient);

  private api = 'https://either-juvenile-progeny.ngrok-free.dev/api/v1';

  private buyersUrl = `${this.api}/admin/buyers`;
  private usersUrl = `${this.api}/admin/users`;

  private headers = new HttpHeaders({
    'ngrok-skip-browser-warning': 'true',
  });

  getAll(): Observable<Buyer[]> {
    return this.http
      .get<ApiResponse<BuyerDto[]>>(this.buyersUrl, {
        headers: this.headers,
      })
      .pipe(map((res) => (res.data ?? []).map((d) => this.toBuyer(d))));
  }

  getById(id: number | string): Observable<Buyer> {
    return this.getAll().pipe(
      map((list) => {
        const found = list.find((b) => String(b.id) === String(id));

        if (!found) {
          throw new Error('Buyer not found');
        }

        return found;
      }),
    );
  }

  suspend(id: number): Observable<void> {
    return this.setStatus(id, 'SUSPENDED');
  }

  reactivate(id: number): Observable<void> {
    return this.setStatus(id, 'ACTIVE');
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<unknown>>(`${this.usersUrl}/${id}`, {
        headers: this.headers,
      })
      .pipe(map(() => void 0));
  }

  private setStatus(id: number, status: string): Observable<void> {
    return this.http
      .put<ApiResponse<unknown>>(
        `${this.usersUrl}/${id}/status`,
        { status },
        {
          headers: this.headers,
        },
      )
      .pipe(map(() => void 0));
  }

  private toBuyer(d: BuyerDto): Buyer {
    return {
      id: d.userId,
      profileId: d.profileId,
      code: d.code,
      name: d.fullName,
      email: d.email,
      phone: d.phone,
      region: d.region,
      address: d.address,
      status: this.mapStatus(d.status),
      type: (d.type?.toLowerCase() === 'corporate' ? 'corporate' : 'individual') as BuyerType,
      ordersCount: d.ordersCount ?? 0,
      totalSpend: d.totalSpend ?? 0,
      disputesCount: d.disputesCount ?? 0,
      createdAt: d.createdAt,
    };
  }

  private mapStatus(s: string): BuyerStatus {
    switch ((s ?? '').toLowerCase()) {
      case 'suspended':
        return 'suspended';

      case 'verified':
      case 'active':
        return 'verified';

      default:
        return 'pending';
    }
  }
}
