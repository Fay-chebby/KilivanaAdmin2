import { Component, OnInit, OnDestroy, computed, effect, inject, signal } from '@angular/core';

import { Router, RouterLink } from '@angular/router';

import { StatCard } from '../../../../shared/components/stat-card/stat-card';
import { ConfirmModal } from '../../../inspectors/components/confirm-modal/confirm-modal';

import { FARM_STATUS_META, Farm, coverOf } from '../../models/farm.model';

import { FarmService } from '../../services/farm.service';
import { ImageLoader } from '../../../../shared/service/image-loader';

@Component({
  selector: 'app-farm-list',
  standalone: true,
  imports: [RouterLink, StatCard, ConfirmModal],
  templateUrl: './farm-list.html',
  styleUrl: './farm-list.scss',
})
export class FarmList implements OnInit, OnDestroy {
  protected readonly service = inject(FarmService);
  protected readonly router = inject(Router);

  protected readonly search = signal('');
  protected readonly county = signal('');
  protected readonly view = signal<'table' | 'grid'>('table');

  protected readonly toDelete = signal<Farm | null>(null);
  protected readonly deleting = signal(false);
  protected readonly deleteError = signal<string | null>(null);

  protected readonly cover = coverOf;
  protected readonly farmMeta = FARM_STATUS_META;

  private readonly imageLoader = inject(ImageLoader);

  private readonly backendOrigin = 'https://either-juvenile-progeny.ngrok-free.dev';

  private readonly loadedCoverUrls = new Map<number, string>();
  private readonly pendingCoverUrls = new Set<string>();

  protected readonly loadedCovers = signal<Record<string, string>>({});

  private destroyed = false;

  private resolveImageUrl(value: string | null | undefined): string {
    const url = (value ?? '').trim();

    if (!url) return '';

    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    if (url.startsWith('/api/v1/')) {
      return `${this.backendOrigin}${url}`;
    }

    if (url === '/api/v1') {
      return `${this.backendOrigin}/api/v1`;
    }

    if (url.startsWith('/')) {
      return `${this.backendOrigin}/api/v1${url}`;
    }

    if (url.startsWith('api/v1/')) {
      return `${this.backendOrigin}/${url}`;
    }

    return `${this.backendOrigin}/api/v1/${url}`;
  }

  protected coverUrl(farm: Farm): string {
    return this.loadedCovers()[String(farm.id)] ?? '';
  }

  private readonly coverEffect = effect(() => {
    const farms = this.service.farms();

    for (const farm of farms) {
      const id = Number(farm.id);
      const source = this.resolveImageUrl(this.cover(farm));

      if (!source || this.loadedCoverUrls.get(id) === source) {
        continue;
      }

      const previous = this.loadedCoverUrls.get(id);

      if (previous) {
        this.imageLoader.revoke(previous);
        this.loadedCoverUrls.delete(id);

        this.loadedCovers.update((current) => {
          const next = { ...current };
          delete next[String(id)];
          return next;
        });
      }

      if (this.pendingCoverUrls.has(source)) {
        continue;
      }

      this.pendingCoverUrls.add(source);
      this.loadedCoverUrls.set(id, source);

      this.imageLoader
        .load(source)
        .then((objectUrl) => {
          if (this.destroyed || this.loadedCoverUrls.get(id) !== source) {
            URL.revokeObjectURL(objectUrl);
            return;
          }

          this.loadedCovers.update((current) => ({
            ...current,
            [String(id)]: objectUrl,
          }));
        })
        .catch((error: unknown) => {
          if (!this.destroyed) {
            console.error(`Failed to load cover photo for farm ${farm.id}:`, source, error);
          }
        })
        .finally(() => {
          this.pendingCoverUrls.delete(source);
        });
    }
  });

  ngOnDestroy(): void {
    this.destroyed = true;

    for (const source of this.loadedCoverUrls.values()) {
      this.imageLoader.revoke(source);
    }

    this.loadedCoverUrls.clear();
    this.pendingCoverUrls.clear();
    this.loadedCovers.set({});
  }

  // Load farms when the page opens.
  ngOnInit(): void {
    this.service.loadFarms();
  }

  protected readonly stats = computed(() => {
    const farms = this.service.farms();

    return {
      total: farms.length,
      active: farms.filter((f) => f.status.toUpperCase() === 'ACTIVE').length,
      fallow: farms.filter((f) => f.status.toUpperCase() === 'FALLOW').length,
      inactive: farms.filter((f) => f.status.toUpperCase() === 'INACTIVE').length,
    };
  });

  protected readonly totalAcres = computed(() =>
    this.service
      .farms()
      .reduce((total, farm) => total + (farm.sizeAcres ?? 0), 0)
      .toFixed(1),
  );

  protected statusMeta(status: string) {
    const key = status.toUpperCase();

    if (key === 'ACTIVE' || key === 'FALLOW' || key === 'INACTIVE') {
      return FARM_STATUS_META[key];
    }

    return {
      label: status || 'Unknown',
      tone: 'gray' as const,
    };
  }

  protected readonly counties = computed(() =>
    [
      ...new Set(
        this.service
          .farms()
          .map((farm) => farm.county)
          .filter((county): county is string => !!county),
      ),
    ].sort(),
  );

  protected readonly rows = computed(() => {
    const q = this.search().toLowerCase().trim();

    return this.service.farms().filter((farm) => {
      const matchesCounty = !this.county() || farm.county === this.county();

      const searchable = [
        farm.name,
        farm.farmerName ?? '',
        farm.county ?? '',
        farm.subCounty ?? '',
        farm.address ?? '',
        ...farm.crops.map((crop) => crop.name ?? ''),
      ];

      const matchesSearch = !q || searchable.some((value) => value.toLowerCase().includes(q));

      return matchesCounty && matchesSearch;
    });
  });

  protected initials(name: string | null): string {
    return (name ?? 'Unknown')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  protected delete(): void {
    const farm = this.toDelete();

    if (!farm || this.deleting()) {
      return;
    }

    this.deleting.set(true);
    this.deleteError.set(null);

    this.service.deleteFarm(farm.id).subscribe({
      next: () => {
        this.toDelete.set(null);
        this.deleting.set(false);
      },
      error: (error: unknown) => {
        this.deleteError.set(
          error instanceof Error ? error.message : 'Unable to delete this farm. Please try again.',
        );

        this.deleting.set(false);
      },
    });
  }
}
