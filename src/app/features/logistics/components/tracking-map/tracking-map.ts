import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewEncapsulation,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import * as L from 'leaflet';
import { Delivery } from '../../models/delivery.model';

interface OsrmResponse {
  code: string;
  message?: string;
  routes?: {
    geometry: GeoJSON.LineString;
    distance: number;
    duration: number;
  }[];
}

@Component({
  selector: 'app-tracking-map',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './tracking-map.html',
  styleUrl: './tracking-map.scss',
})
export class TrackingMap implements AfterViewInit, OnDestroy {
  deliveries = input.required<Delivery[]>();
  selectedId = input<string | null>(null);
  height = input('380px');

  picked = output<string>();

  private mapEl = viewChild.required<ElementRef<HTMLDivElement>>('mapEl');

  private map?: L.Map;
  private ready = signal(false);

  private markerLayer?: L.LayerGroup;
  private routeLayer?: L.GeoJSON;

  private drawVersion = 0;

  constructor() {
    effect(() => {
      const deliveries = this.deliveries();
      const selected = this.selectedId();

      if (this.ready()) {
        this.draw(deliveries, selected);
      }
    });
  }

  ngAfterViewInit(): void {
    this.map = L.map(this.mapEl().nativeElement, {
      center: [-1.2921, 36.8219],
      zoom: 9,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);

    this.markerLayer = L.layerGroup().addTo(this.map);

    this.routeLayer = L.geoJSON(undefined, {
      style: () => ({
        color: '#2563eb',
        weight: 5,
        opacity: 0.9,
      }),
    }).addTo(this.map);

    this.map.whenReady(() => {
      this.ready.set(true);
      this.map?.invalidateSize();
    });
  }

  ngOnDestroy(): void {
    this.drawVersion++;
    this.map?.remove();
    this.map = undefined;
    this.markerLayer = undefined;
    this.routeLayer = undefined;
  }

  private draw(deliveries: Delivery[], selected: string | null): void {
    const map = this.map;

    if (!map || !this.markerLayer || !this.routeLayer) {
      return;
    }

    const version = ++this.drawVersion;

    this.markerLayer.clearLayers();
    this.routeLayer.clearLayers();

    // Display all delivery markers, even when one delivery is selected.
    this.renderMarkers(deliveries);

    // If selected, draw only that delivery's route.
    const focused = deliveries.filter((delivery) => !selected || delivery.id === selected);

    const validDeliveries = focused.filter(
      (delivery) =>
        this.validCoordinates(delivery.origin.lat, delivery.origin.lng) &&
        this.validCoordinates(delivery.destination.lat, delivery.destination.lng),
    );

    if (validDeliveries.length === 0) {
      return;
    }

    const requests = validDeliveries.map((delivery) => this.fetchRoute(delivery));

    Promise.all(requests)
      .then((results) => {
        if (version !== this.drawVersion || !this.map) {
          return;
        }

        const bounds = L.latLngBounds([]);

        results.forEach((result, index) => {
          if (!result) {
            return;
          }

          const delivery = validDeliveries[index];

          const feature: GeoJSON.Feature<GeoJSON.LineString> = {
            type: 'Feature',
            properties: {
              deliveryId: delivery.id,
              distance: result.distance,
              duration: result.duration,
            },
            geometry: result.geometry,
          };

          this.routeLayer?.addData(feature);

          // Fit the map around the actual road route.
          result.geometry.coordinates.forEach(([lng, lat]) => {
            bounds.extend([lat, lng]);
          });
        });

        // Include marker positions in the visible map area.
        validDeliveries.forEach((delivery) => {
          bounds.extend([delivery.origin.lat, delivery.origin.lng]);

          bounds.extend([delivery.destination.lat, delivery.destination.lng]);
        });

        if (bounds.isValid()) {
          this.map?.fitBounds(bounds, {
            padding: [40, 40],
            maxZoom: 15,
          });
        }
      })
      .catch((error: unknown) => {
        console.error('Unable to draw delivery routes:', error);
      });
  }

  private fetchRoute(delivery: Delivery): Promise<{
    geometry: GeoJSON.LineString;
    distance: number;
    duration: number;
  } | null> {
    const { origin, destination } = delivery;

    const coordinates = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;

    const url =
      `https://router.project-osrm.org/route/v1/driving/${coordinates}` +
      '?overview=full&geometries=geojson&steps=true';

    return fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`OSRM returned HTTP ${response.status}`);
        }

        return response.json() as Promise<OsrmResponse>;
      })
      .then((result) => {
        if (result.code !== 'Ok' || !result.routes?.length) {
          console.warn(
            `No road route found for delivery ${delivery.id}:`,
            result.message ?? result.code,
          );

          return null;
        }

        const route = result.routes[0];

        console.info(`Route loaded for delivery ${delivery.id}`, {
          distanceKm: (route.distance / 1000).toFixed(2),
          durationMinutes: Math.round(route.duration / 60),
        });

        return {
          geometry: route.geometry,
          distance: route.distance,
          duration: route.duration,
        };
      })
      .catch((error: unknown) => {
        console.error(`Failed to load road route for delivery ${delivery.id}:`, error);

        return null;
      });
  }

  private renderMarkers(deliveries: Delivery[]): void {
    const layer = this.markerLayer;

    if (!layer) {
      return;
    }

    for (const delivery of deliveries) {
      if (this.validCoordinates(delivery.origin.lat, delivery.origin.lng)) {
        this.addMarker(
          delivery.origin.lat,
          delivery.origin.lng,
          '🌾',
          delivery.farmName,
          '#16a34a',
        );
      }

      if (this.validCoordinates(delivery.destination.lat, delivery.destination.lng)) {
        this.addMarker(
          delivery.destination.lat,
          delivery.destination.lng,
          '🏠',
          delivery.buyerName,
          '#dc2626',
        );
      }

      if (this.validCoordinates(delivery.position.lat, delivery.position.lng)) {
        const driverIcon = L.divIcon({
          className: 'kilivana-driver-icon',
          html: '<span>🚚</span>',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        const driverMarker = L.marker([delivery.position.lat, delivery.position.lng], {
          icon: driverIcon,
        })
          .bindTooltip(`${delivery.driver.name} (${delivery.driver.plate})`)
          .on('click', () => {
            this.picked.emit(delivery.id);
          });

        layer.addLayer(driverMarker);
      }
    }
  }

  private addMarker(lat: number, lng: number, emoji: string, title: string, color: string): void {
    const icon = L.divIcon({
      className: 'kilivana-map-marker',
      html: `
        <div style="
          display:grid;
          place-items:center;
          width:34px;
          height:34px;
          border-radius:50%;
          background:#fff;
          border:3px solid ${color};
          font-size:17px;
          box-shadow:0 1px 5px rgba(0,0,0,.25);
        ">${emoji}</div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const marker = L.marker([lat, lng], { icon }).bindTooltip(title);

    this.markerLayer?.addLayer(marker);
  }

  private validCoordinates(lat: number, lng: number): boolean {
    return (
      Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
    );
  }
}
