import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FarmService } from '../../services/farm.service';

@Component({
  selector: 'app-crop-list',
  imports: [RouterLink],
  templateUrl: './crop-list.html',
  styleUrl: './crop-list.scss',
})
export class CropList {
  private readonly service = inject(FarmService);
  protected readonly search = signal('');

  protected readonly crops = computed(() => {
    const q = this.search().toLowerCase().trim();
    return this.service.crops().filter((c) => !q || c.name.toLowerCase().includes(q));
  });
  protected readonly max = computed(() =>
    Math.max(1, ...this.service.crops().map((c) => c.hectares)),
  );
}
