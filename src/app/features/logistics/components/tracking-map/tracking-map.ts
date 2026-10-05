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

const pin = (emoji: string, color: string) =>
  L.divIcon({
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    html: `<span style="display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:#fff;border:3px solid ${color};font-size:16px;box-shadow:0 1px 4px rgba(0,0,0,.3)">${emoji}</span>`,
  });

@Component({
  selector: 'app-tracking-map',
  standalone: true,
  encapsulation: ViewEncapsulation.None, // Leaflet creates DOM outside Angular's view
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
  private layer = L.layerGroup();
  private ready = signal(false);
  private fitKey = '';

  constructor() {
    effect(() => {
      const list = this.deliveries();
      const sel = this.selectedId();
      if (this.ready()) this.draw(list, sel);
    });
  }

  ngAfterViewInit() {
    this.map = L.map(this.mapEl().nativeElement).setView([-1.2921, 36.8219], 9);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);
    this.layer.addTo(this.map);
    this.ready.set(true);
  }

  ngOnDestroy() {
    this.map?.remove();
  }

  private draw(list: Delivery[], sel: string | null) {
    if (!this.map) return;
    this.layer.clearLayers();
    const focus = list.filter((d) => !sel || d.id === sel);

    for (const d of list) {
      const o: L.LatLngTuple = [d.origin.lat, d.origin.lng];
      const b: L.LatLngTuple = [d.destination.lat, d.destination.lng];
      const p: L.LatLngTuple = [d.position.lat, d.position.lng];
      const active = list.length === 1 || d.id === sel;
      L.polyline([o, b], {
        color: active ? '#2563eb' : '#94a3b8',
        weight: active ? 4 : 2,
        dashArray: '6 8',
      }).addTo(this.layer);
      L.marker(o, { icon: pin('🌾', '#16a34a'), title: d.farmName }).addTo(this.layer);
      L.marker(b, { icon: pin('🏠', '#dc2626'), title: d.buyerName }).addTo(this.layer);
      L.marker(p, {
        icon: pin('🚚', '#2563eb'),
        zIndexOffset: 1000,
        title: `${d.driver.name} (${d.driver.plate})`,
      })
        .on('click', () => this.picked.emit(d.id))
        .addTo(this.layer);
    }

    // Re-fit only when the focus changes, so the map doesn't jump on every GPS tick.
    const key = focus.map((d) => d.id).join(',');
    if (key !== this.fitKey && focus.length) {
      const pts = focus.flatMap(
        (d) =>
          [
            [d.origin.lat, d.origin.lng],
            [d.destination.lat, d.destination.lng],
          ] as L.LatLngTuple[],
      );
      this.map.fitBounds(L.latLngBounds(pts), { padding: [40, 40] });
      this.fitKey = key;
    }
  }
}
