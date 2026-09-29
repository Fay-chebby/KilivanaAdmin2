import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FarmerFilterValue, FarmerStatus, KENYA_COUNTIES } from '../../models/farmer.model';

@Component({
  selector: 'app-farmer-filters',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './farmer-filters.html',
  styleUrl: './farmer-filters.scss',
})
export class FarmerFilters {
  readonly regions = KENYA_COUNTIES;
  readonly statuses: { value: FarmerStatus; label: string }[] = [
    { value: 'verified', label: 'Verified' },
    { value: 'pending', label: 'Pending' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'rejected', label: 'Rejected' },
  ];
  readonly changed = output<FarmerFilterValue>();

  search = '';
  region = '';
  status: '' | FarmerStatus = '';

  emit() {
    this.changed.emit({ search: this.search, region: this.region, status: this.status });
  }
}
