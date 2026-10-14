import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FarmService } from '../../services/farm.service';

@Component({
  selector: 'app-crop-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './crop-list.html',
  styleUrl: './crop-list.scss',
})
export class CropList {
  private readonly service = inject(FarmService);

  protected readonly search = signal('');

  protected readonly crops = computed(() => {
    const farms = this.service.farms();
    const crops = this.service.crops();
    const grouped = new Map<
      string,
      {
        id: number;
        name: string;
        farms: Set<number>;
        counties: Set<string>;
        hectares: number;
      }
    >();

    for (const crop of crops) {
      const name = crop.name?.trim();

      if (!name) continue;

      if (!grouped.has(name)) {
        grouped.set(name, {
          id: crop.typeId ?? crop.id,
          name,
          farms: new Set<number>(),
          counties: new Set<string>(),
          hectares: 0,
        });
      }

      const summary = grouped.get(name)!;

      if (crop.farmId !== null) {
        summary.farms.add(crop.farmId);

        const farm = farms.find((f) => f.id === crop.farmId);

        if (farm?.county) {
          summary.counties.add(farm.county);
        }
      }

      // Convert crop area from acres to hectares.
      summary.hectares += (crop.areaAcres ?? 0) * 0.404686;
    }

    const query = this.search().trim().toLowerCase();

    return [...grouped.values()]
      .map((crop) => ({
        id: crop.id,
        name: crop.name,
        farms: crop.farms.size,
        counties: crop.counties,
        hectares: crop.hectares,
      }))
      .filter((crop) => crop.name.toLowerCase().includes(query))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  protected readonly max = computed(() =>
    Math.max(1, ...this.crops().map((crop) => crop.hectares)),
  );
}
