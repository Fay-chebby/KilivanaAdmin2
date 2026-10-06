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

// ============================================================
// ADMIN DRIVER RESPONSE
// ============================================================

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
  vehicleNumber: string;
  plateNumber: string;
  vehicleMake: string;

  activeOrderId: number | null;
  totalDeliveries: number;
  rating: number | null;

  createdAt: string;
}

// ============================================================
// DRIVER PROFILE RESPONSE
// ============================================================

interface DriverProfileApiResponse {
  id: number;
  userId: number;

  address: string;

  licenseNumber: string;

  vehicleType: string;
  vehicleNumber: string;
  vehicleDetails: string;

  vehicleMake: string;

  vehicleCapacityKg: number;
  vehicleCapacity: string;

  licenseExpiryDate: string;

  idType: string;
  idNumber: string;

  kycStatus: string;
  availabilityStatus: string;

  suspensionReason: string | null;

  createdAt: string;
  updatedAt: string;

  images: DriverProfileImage[];
}

interface DriverProfileImage {
  id: number;
  url: string;
  publicId: string;
  assetId: string;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// CREATE DRIVER REQUEST
// ============================================================

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

// ============================================================
// UPDATE DRIVER PROFILE REQUEST
// ============================================================

interface UpdateDriverProfileRequest {
  address: string;
  licenseNumber: string;
  vehicleType: string;
  vehicleNumber: string;
  vehicleDetails: string;
  vehicleMake: string;
  vehicleCapacityKg: number;
  vehicleCapacity: string;
  licenseExpiryDate: string;
  idType: string;
  idNumber: string;
  kycStatus: string;
  availabilityStatus: string;
  suspensionReason: string | null;
}

// ============================================================
// NOTICE
// ============================================================

export interface Notice {
  text: string;
  type: 'success' | 'error';
}

// ============================================================
// SERVICE
// ============================================================

@Injectable({
  providedIn: 'root',
})
export class DriverService {
  private readonly http = inject(HttpClient);

  private readonly _drivers = signal<Driver[]>([]);

  readonly drivers = this._drivers.asReadonly();

  readonly notice = signal<Notice | null>(null);

  private noticeTimer?: ReturnType<typeof setTimeout>;

  // ============================================================
  // LOAD DRIVERS
  // ============================================================

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

  // ============================================================
  // CREATE DRIVER
  // ============================================================

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

  // ============================================================
  // GET DRIVER
  // ============================================================

  getById(userId: number): Observable<ApiResponse<DriverApiResponse>> {
    return this.http.get<ApiResponse<DriverApiResponse>>(
      `${API_BASE_URL}/admin/drivers/${userId}`,
      {
        headers: NGROK_HEADERS,
      },
    );
  }

  // ============================================================
  // UPDATE DRIVER PROFILE
  // ============================================================

  update(
    userId: number,
    value: DriverFormValue,
  ): Observable<ApiResponse<DriverProfileApiResponse>> {
    const request: UpdateDriverProfileRequest = {
      address: value.address.trim(),

      licenseNumber: value.licenceNumber.trim(),

      vehicleType: value.vehicleType.toUpperCase(),

      vehicleNumber: value.plateNumber.trim().toUpperCase(),

      vehicleDetails: '',

      vehicleMake: value.vehicleMake.trim(),

      vehicleCapacityKg: this.extractCapacityKg(value.vehicleCapacity),

      vehicleCapacity: value.vehicleCapacity.trim(),

      licenseExpiryDate: value.licenceExpiry,

      idType: value.idType,

      idNumber: value.idNumber.trim(),

      kycStatus: value.kycStatus.toUpperCase(),

      availabilityStatus: 'AVAILABLE',

      suspensionReason: null,
    };

    console.log('Updating driver userId:', userId);

    console.log('Update driver request:', request);

    return this.http
      .put<ApiResponse<DriverProfileApiResponse>>(
        `${API_BASE_URL}/profiles/drivers/${userId}`,
        request,
        {
          headers: NGROK_HEADERS,
        },
      )
      .pipe(
        tap((response) => {
          if (!response.success) {
            this.flash(response.message || 'Failed to update driver.', 'error');

            return;
          }

          this.flash('Driver updated successfully.');
        }),
      );
  }

  // ============================================================
  // CAPACITY HELPER
  // ============================================================

  private extractCapacityKg(value: string): number {
    if (!value) {
      return 0;
    }

    const match = value.match(/[\d,.]+/);

    if (!match) {
      return 0;
    }

    return Number(match[0].replace(/,/g, '')) || 0;
  }

  // ============================================================
  // DELETE DRIVER
  // ============================================================

  delete(userId: number): Observable<ApiResponse<unknown>> {
    return this.http
      .delete<ApiResponse<unknown>>(`${API_BASE_URL}/admin/drivers/${userId}`, {
        headers: NGROK_HEADERS,
      })
      .pipe(
        tap((response) => {
          if (!response.success) {
            this.flash(response.message || 'Failed to delete driver.', 'error');

            return;
          }

          const driver = this._drivers().find((item) => item.id === userId);

          this._drivers.update((drivers) => drivers.filter((item) => item.id !== userId));

          if (driver) {
            this.flash(`${driver.fullName} was deleted.`);
          }
        }),
      );
  }

  // ============================================================
  // SUSPEND DRIVER
  // ============================================================

  suspend(userId: number, reason: string): Observable<ApiResponse<DriverApiResponse>> {
    const params = new HttpParams().set('reason', reason.trim());

    return this.http
      .put<ApiResponse<DriverApiResponse>>(
        `${API_BASE_URL}/admin/drivers/${userId}/suspend`,
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

  // ============================================================
  // ACTIVATE / UNSUSPEND DRIVER
  // ============================================================

  unsuspend(userId: number): Observable<ApiResponse<DriverApiResponse>> {
    return this.http
      .put<ApiResponse<DriverApiResponse>>(
        `${API_BASE_URL}/admin/drivers/${userId}/unsuspend`,
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

  // ============================================================
  // CHECK DRIVER LOCK
  // ============================================================

  isLocked(driver: Driver): boolean {
    return driver.status === 'on-delivery';
  }

  // ============================================================
  // API -> FRONTEND DRIVER
  // ============================================================

  private fromApi(driver: DriverApiResponse): Driver {
    return {
      id: driver.userId,

      profileId: driver.profileId,

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

        plateNumber: driver.vehicleNumber || driver.plateNumber,

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

  // ============================================================
  // STATUS MAPPING
  // ============================================================

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

  // ============================================================
  // KYC MAPPING
  // ============================================================

  private mapKycStatus(status: string): Driver['kycStatus'] {
    return status?.toUpperCase() === 'VERIFIED' ? 'verified' : 'pending';
  }

  // ============================================================
  // VEHICLE TYPE MAPPING
  // ============================================================

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

  // ============================================================
  // NOTIFICATION
  // ============================================================

  private flash(text: string, type: Notice['type'] = 'success'): void {
    clearTimeout(this.noticeTimer);

    this.notice.set({
      text,
      type,
    });

    this.noticeTimer = setTimeout(() => this.notice.set(null), 3500);
  }

  // ============================================================
  // MAP API DRIVER
  // ============================================================

  mapApiDriver(driver: DriverApiResponse): Driver {
    return this.fromApi(driver);
  }

  // ============================================================
  // UPDATE LOCAL DRIVER
  // ============================================================

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
