import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Driver, DriverFormValue } from '../models/driver.model';

const API_BASE_URL = 'https://either-juvenile-progeny.ngrok-free.dev/api/v1';

const NGROK_HEADERS = new HttpHeaders({
  'ngrok-skip-browser-warning': 'true',
});

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  error: {
    code: string;
    details: unknown;
  } | null;
}

interface DriverApiResponse {
  userId: number;
  profileId: number;
  code: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  region: string;
  address: string;
  status: string;
  suspensionReason: string | null;
  idType: string;
  idNumber: string;
  licenseNumber: string;
  licenseExpiryDate: string;
  kycStatus: string;
  vehicleType: string;
  vehicleCapacity: string;
  plateNumber: string;
  vehicleMake: string;
  activeOrderId: number | null;
  totalDeliveries: number;
  rating: number | null;
  createdAt: string;
}

interface RegisterDriverRequest {
  fullName: string;
  username: string;
  password: string;
  phone: string;
  email: string;
  region: string;
  address: string;
  idType: string;
  idNumber: string;
  licenceNumber: string;
  licenceExpiry: string;
  kycStatus: string;
  vehicleType: string;
  vehicleCapacity: string;
  plateNumber: string;
  vehicleMake: string;
  availabilityStatus: string;
}

export interface Notice {
  text: string;
  type: 'success' | 'error';
}

@Injectable({
  providedIn: 'root',
})
export class DriverService {
  private readonly http = inject(HttpClient);

  private readonly _drivers = signal<Driver[]>([]);
  readonly drivers = this._drivers.asReadonly();

  readonly notice = signal<Notice | null>(null);

  private noticeTimer?: ReturnType<typeof setTimeout>;

  loadDrivers(): Observable<ApiResponse<DriverApiResponse[]>> {
    return this.http
      .get<ApiResponse<DriverApiResponse[]>>(`${API_BASE_URL}/admin/drivers`, {
        headers: NGROK_HEADERS,
      })
      .pipe(
        tap((response) => {
          if (!response.success) {
            console.error('Failed to load drivers:', response.message);

            this._drivers.set([]);
            return;
          }

          const apiDrivers = response.data ?? [];

          const drivers = apiDrivers.map((driver) => this.fromApi(driver));

          this._drivers.set(drivers);
        }),
      );
  }

  create(value: DriverFormValue): Observable<ApiResponse<DriverApiResponse>> {
    const request: RegisterDriverRequest = {
      fullName: value.fullName.trim(),

      username: value.email.trim().toLowerCase().split('@')[0],

      password: value.password,

      phone: value.phone.trim(),

      email: value.email.trim().toLowerCase(),

      region: value.region,

      address: value.address.trim(),

      idType: value.idType,

      idNumber: value.idNumber.trim(),

      licenceNumber: value.licenceNumber.trim(),

      licenceExpiry: value.licenceExpiry,

      kycStatus: value.kycStatus.toUpperCase(),

      vehicleType: value.vehicleType.toUpperCase(),

      vehicleCapacity: value.vehicleCapacity.trim(),

      plateNumber: value.plateNumber.trim().toUpperCase(),

      vehicleMake: value.vehicleMake.trim(),

      availabilityStatus: 'AVAILABLE',
    };

    return this.http
      .post<ApiResponse<DriverApiResponse>>(`${API_BASE_URL}/admin/drivers`, request, {
        headers: NGROK_HEADERS,
      })
      .pipe(
        tap((response) => {
          if (!response.success) {
            console.error('Driver creation failed:', response.message);

            this.flash(response.message || 'Failed to create driver.', 'error');

            return;
          }

          const driver = this.fromApi(response.data);

          this._drivers.update((drivers) => [driver, ...drivers]);

          this.flash(`${driver.fullName} registered successfully.`);
        }),
      );
  }

  getById(id: number): Observable<ApiResponse<DriverApiResponse>> {
    return this.http.get<ApiResponse<DriverApiResponse>>(`${API_BASE_URL}/admin/drivers/${id}`, {
      headers: NGROK_HEADERS,
    });
  }

  delete(id: number): Observable<ApiResponse<unknown>> {
    return this.http
      .delete<ApiResponse<unknown>>(`${API_BASE_URL}/admin/drivers/${id}`, {
        headers: NGROK_HEADERS,
      })
      .pipe(
        tap((response) => {
          if (!response.success) {
            this.flash(response.message || 'Failed to delete driver.', 'error');

            return;
          }

          const driver = this._drivers().find((item) => item.id === id);

          this._drivers.update((drivers) => drivers.filter((item) => item.id !== id));

          if (driver) {
            this.flash(`${driver.fullName} was deleted.`);
          }
        }),
      );
  }
  suspend(id: number, reason: string): Observable<ApiResponse<DriverApiResponse>> {
    const params = new HttpParams().set('reason', reason.trim());

    return this.http
      .put<ApiResponse<DriverApiResponse>>(
        `${API_BASE_URL}/admin/drivers/${id}/suspend`,
        {},
        {
          headers: NGROK_HEADERS,
          params,
        },
      )
      .pipe(
        tap((response) => {
          if (!response.success) {
            this.flash(response.message || 'Failed to suspend driver.', 'error');

            return;
          }

          const driver = this.fromApi(response.data);

          this._drivers.update((drivers) =>
            drivers.map((item) => (item.id === driver.id ? driver : item)),
          );

          this.flash(`${driver.fullName} was suspended.`);
        }),
      );
  }
  unsuspend(id: number): Observable<ApiResponse<DriverApiResponse>> {
    return this.http
      .put<ApiResponse<DriverApiResponse>>(
        `${API_BASE_URL}/admin/drivers/${id}/unsuspend`,
        {},
        {
          headers: NGROK_HEADERS,
        },
      )
      .pipe(
        tap((response) => {
          if (!response.success) {
            this.flash(response.message || 'Failed to activate driver.', 'error');

            return;
          }

          const driver = this.fromApi(response.data);

          this._drivers.update((drivers) =>
            drivers.map((item) => (item.id === driver.id ? driver : item)),
          );

          this.flash(`${driver.fullName} was activated.`);
        }),
      );
  }

  isLocked(driver: Driver): boolean {
    return driver.status === 'on-delivery';
  }

  private fromApi(driver: DriverApiResponse): Driver {
    return {
      id: driver.userId,

      code: driver.code,

      fullName: driver.fullName,

      username: driver.username,

      phone: driver.phone,

      email: driver.email,

      region: driver.region,

      address: driver.address,

      status: this.mapStatus(driver.status),

      suspensionReason: driver.suspensionReason ?? null,

      idType: driver.idType as Driver['idType'],

      idNumber: driver.idNumber,

      licenceNumber: driver.licenseNumber,

      licenceExpiry: driver.licenseExpiryDate,

      kycStatus: this.mapKycStatus(driver.kycStatus),

      vehicle: {
        type: this.mapVehicleType(driver.vehicleType),

        capacity: driver.vehicleCapacity,

        plateNumber: driver.plateNumber,

        make: driver.vehicleMake,
      },

      activeDelivery:
        driver.activeOrderId !== null && driver.activeOrderId !== undefined
          ? String(driver.activeOrderId)
          : null,

      totalDeliveries: driver.totalDeliveries ?? 0,

      rating: driver.rating ?? null,

      createdAt: driver.createdAt,
    };
  }

  private mapStatus(status: string): Driver['status'] {
    switch (status?.toUpperCase()) {
      case 'AVAILABLE':
        return 'available';

      case 'ON_DELIVERY':
      case 'ON-DELIVERY':
        return 'on-delivery';

      case 'SUSPENDED':
        return 'suspended';

      case 'OFFLINE':
        return 'offline';

      default:
        console.warn('Unknown driver status from backend:', status);

        return 'offline';
    }
  }

  private mapKycStatus(status: string): Driver['kycStatus'] {
    return status?.toUpperCase() === 'VERIFIED' ? 'verified' : 'pending';
  }

  private mapVehicleType(type: string): Driver['vehicle']['type'] {
    switch (type?.toUpperCase()) {
      case 'VAN':
        return 'Van';

      case 'PICKUP':
        return 'Pickup';

      case 'MOTORBIKE':
        return 'Motorbike';

      case 'TRUCK':
        return 'Truck';

      default:
        console.warn('Unknown vehicle type from backend:', type);

        return 'Truck';
    }
  }

  private flash(text: string, type: Notice['type'] = 'success'): void {
    clearTimeout(this.noticeTimer);

    this.notice.set({
      text,
      type,
    });

    this.noticeTimer = setTimeout(() => {
      this.notice.set(null);
    }, 3500);
  }

  mapApiDriver(driver: DriverApiResponse): Driver {
    return this.fromApi(driver);
  }

  setDriver(driver: Driver): void {
    this._drivers.update((drivers) => {
      const exists = drivers.some((item) => item.id === driver.id);

      if (exists) {
        return drivers.map((item) => (item.id === driver.id ? driver : item));
      }

      return [driver, ...drivers];
    });
  }
}
