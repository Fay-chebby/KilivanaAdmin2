import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FarmerFilterValue, FarmerStatus } from '../../models/farmer.model';

@Component({
  selector: 'app-farmer-filters',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './farmer-filters.html',
  styleUrl: './farmer-filters.scss',
})
export class FarmerFilters {
  readonly regions = input<string[]>([]);
  readonly statuses: { value: FarmerStatus; label: string }[] = [
    { value: 'verified', label: 'Verified' },
    { value: 'pending', label: 'Pending' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'inactive', label: 'Inactive' },
  ];
  readonly changed = output<FarmerFilterValue>();

  search = '';
  region = '';
  status: '' | FarmerStatus = '';

  emit() {
    this.changed.emit({ search: this.search, region: this.region, status: this.status });
  }
}
