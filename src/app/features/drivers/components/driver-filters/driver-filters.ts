import { Component, input, model } from '@angular/core';
import { DriverStatus } from '../../models/driver.model';

@Component({
  selector: 'app-driver-filters',
  templateUrl: './driver-filters.html',
  styleUrl: './driver-filters.scss',
})
export class DriverFilters {
  regions = input<readonly string[]>([]);
  search = model('');
  status = model<'all' | DriverStatus>('all');
  region = model('all');

  onSearch(e: Event) {
    this.search.set((e.target as HTMLInputElement).value);
  }
  onStatus(e: Event) {
    this.status.set((e.target as HTMLSelectElement).value as 'all' | DriverStatus);
  }
  onRegion(e: Event) {
    this.region.set((e.target as HTMLSelectElement).value);
  }
}
