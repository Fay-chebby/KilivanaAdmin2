import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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

  private readonly apiUrl = `${API_BASE}/admin/pickup-stations`;

  // HTTP headers
  private readonly headers = new HttpHeaders({
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'ngrok-skip-browser-warning': 'true',
  });

  /* --------------------------------
     GET ALL PICKUP STATIONS
  --------------------------------- */

  getAll(): Observable<PickupStation[]> {
    return this.http
      .get<PickupStationApiResponse<PickupStation[]>>(this.apiUrl, {
        headers: this.headers,
      })
      .pipe(map((response) => response.data ?? []));
  }

  /* --------------------------------
     GET PICKUP STATION BY ID
  --------------------------------- */

  getById(id: number): Observable<PickupStation> {
    return this.http
      .get<
        PickupStationApiResponse<PickupStation>
      >(`${this.apiUrl}/${id}`, { headers: this.headers })
      .pipe(map((response) => response.data));
  }

  /* --------------------------------
     CREATE PICKUP STATION
  --------------------------------- */

  create(payload: PickupStationRequest): Observable<PickupStation> {
    return this.http
      .post<
        PickupStationApiResponse<PickupStation>
      >(this.apiUrl, payload, { headers: this.headers })
      .pipe(map((response) => response.data));
  }

  /* --------------------------------
     UPDATE PICKUP STATION
  --------------------------------- */

  update(id: number, payload: PickupStationRequest): Observable<PickupStation> {
    return this.http
      .put<
        PickupStationApiResponse<PickupStation>
      >(`${this.apiUrl}/${id}`, payload, { headers: this.headers })
      .pipe(map((response) => response.data));
  }

  /* --------------------------------
     DEACTIVATE PICKUP STATION
  --------------------------------- */

  deactivate(id: number): Observable<void> {
    return this.http
      .delete<PickupStationApiResponse<unknown>>(`${this.apiUrl}/${id}`, { headers: this.headers })
      .pipe(map(() => undefined));
  }
}
