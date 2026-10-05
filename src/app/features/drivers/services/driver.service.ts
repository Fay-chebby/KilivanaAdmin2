import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { Driver, DriverFormValue } from '../models/driver.model';

const API_BASE_URL = 'https://kilivana-backend-a44w.onrender.com/api/v1';

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

  /**
   * Load all drivers from the backend.
   */
  loadDrivers(): Observable<ApiResponse<DriverApiResponse[]>> {
    return this.http.get<ApiResponse<DriverApiResponse[]>>(`${API_BASE_URL}/admin/drivers`).pipe(
      tap((response) => {
        const drivers = response.data.map((driver) => this.fromApi(driver));

        this._drivers.set(drivers);
      }),
    );
  }

  /**
   * Register a new driver.
   */
  create(value: DriverFormValue): Observable<ApiResponse<DriverApiResponse>> {
    const request: RegisterDriverRequest = {
      fullName: value.fullName.trim(),
      username: value.username.trim(),
      password: value.password,

      phone: value.phone.trim(),
      email: value.email.trim(),

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
      .post<ApiResponse<DriverApiResponse>>(`${API_BASE_URL}/admin/drivers`, request)
      .pipe(
        tap((response) => {
          const driver = this.fromApi(response.data);

          this._drivers.update((drivers) => [driver, ...drivers]);

          this.flash(`${driver.fullName} registered successfully.`);
        }),
      );
  }

  /**
   * Get one driver from the backend.
   */
  getById(id: number): Observable<ApiResponse<DriverApiResponse>> {
    return this.http.get<ApiResponse<DriverApiResponse>>(`${API_BASE_URL}/admin/drivers/${id}`);
  }

  /**
   * Delete a driver.
   */
  delete(id: number): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${API_BASE_URL}/admin/drivers/${id}`).pipe(
      tap(() => {
        const driver = this._drivers().find((d) => d.id === id);

        this._drivers.update((drivers) => drivers.filter((d) => d.id !== id));

        if (driver) {
          this.flash(`${driver.fullName} was deleted.`);
        }
      }),
    );
  }

  /**
   * Check whether a driver is currently locked because
   * they have an active delivery.
   */
  isLocked(driver: Driver): boolean {
    return driver.status === 'on-delivery';
  }

  /**
   * Convert backend driver response into the model
   * currently used by the Angular UI.
   */
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

      totalDeliveries: driver.totalDeliveries,

      rating: driver.rating ?? null,

      createdAt: driver.createdAt,
    };
  }

  private mapStatus(status: string): Driver['status'] {
    switch (status.toUpperCase()) {
      case 'AVAILABLE':
        return 'available';

      case 'ON_DELIVERY':
      case 'ON-DELIVERY':
        return 'on-delivery';

      case 'SUSPENDED':
        return 'suspended';

      case 'OFFLINE':
      default:
        return 'offline';
    }
  }

  private mapKycStatus(status: string): Driver['kycStatus'] {
    return status.toUpperCase() === 'VERIFIED' ? 'verified' : 'pending';
  }

  private mapVehicleType(type: string): Driver['vehicle']['type'] {
    switch (type.toUpperCase()) {
      case 'VAN':
        return 'Van';

      case 'PICKUP':
        return 'Pickup';

      case 'MOTORBIKE':
        return 'Motorbike';

      case 'TRUCK':
      default:
        return 'Truck';
    }
  }

  private flash(text: string, type: Notice['type'] = 'success'): void {
    clearTimeout(this.noticeTimer);

    this.notice.set({
      text,
      type,
    });

    this.noticeTimer = setTimeout(() => this.notice.set(null), 3500);
  }
  mapApiDriver(driver: DriverApiResponse): Driver {
    return this.fromApi(driver);
  }

  setDriver(driver: Driver): void {
    this._drivers.update((drivers) => {
      const exists = drivers.some((d) => d.id === driver.id);

      if (exists) {
        return drivers.map((d) => (d.id === driver.id ? driver : d));
      }

      return [driver, ...drivers];
    });
  }
}
