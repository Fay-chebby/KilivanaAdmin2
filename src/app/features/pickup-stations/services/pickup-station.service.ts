import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import {
  PickupStation,
  PickupStationRequest,
  PickupStationApiResponse,
} from '../models/pickup-station.model';
import { API_BASE } from '../../../core/config/api.config';

@Injectable({
  providedIn: 'root',
})
export class PickupStationService {
  private readonly http = inject(HttpClient);

  // Kilivana backend API
  private readonly apiUrl = `${API_BASE}/admin/pickup-stations`;
  /* --------------------------------
     GET ALL PICKUP STATIONS
  --------------------------------- */

  getAll(): Observable<PickupStation[]> {
    return this.http
      .get<PickupStationApiResponse<PickupStation[]>>(this.apiUrl)
      .pipe(map((response) => response.data ?? []));
  }

  /* --------------------------------
     GET PICKUP STATION BY ID
  --------------------------------- */

  getById(id: number): Observable<PickupStation> {
    return this.http
      .get<PickupStationApiResponse<PickupStation>>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  /* --------------------------------
     CREATE PICKUP STATION
  --------------------------------- */

  create(payload: PickupStationRequest): Observable<PickupStation> {
    return this.http
      .post<PickupStationApiResponse<PickupStation>>(this.apiUrl, payload)
      .pipe(map((response) => response.data));
  }

  /* --------------------------------
     UPDATE PICKUP STATION
  --------------------------------- */

  update(id: number, payload: PickupStationRequest): Observable<PickupStation> {
    return this.http
      .put<PickupStationApiResponse<PickupStation>>(`${this.apiUrl}/${id}`, payload)
      .pipe(map((response) => response.data));
  }

  /* --------------------------------
     DEACTIVATE PICKUP STATION
  --------------------------------- */

  deactivate(id: number): Observable<void> {
    return this.http
      .delete<PickupStationApiResponse<unknown>>(`${this.apiUrl}/${id}`)
      .pipe(map(() => undefined));
  }
}
