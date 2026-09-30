import { Component, HostListener, computed, input, signal } from '@angular/core';
import { FarmImage } from '../../models/farm.model';

type Filter = 'all' | 'farmer' | 'inspector';

@Component({
  selector: 'app-farm-gallery',
  templateUrl: './farm-gallery.html',
  styleUrl: './farm-gallery.scss',
})
export class FarmGallery {
  readonly images = input.required<FarmImage[]>();

  protected readonly filter = signal<Filter>('all');
  protected readonly index = signal<number | null>(null);

  protected readonly farmerCount = computed(
    () => this.images().filter((i) => i.uploadedBy === 'farmer').length,
  );
  protected readonly inspectorCount = computed(
    () => this.images().filter((i) => i.uploadedBy === 'inspector').length,
  );
  protected readonly visible = computed(() =>
    this.images().filter((i) => this.filter() === 'all' || i.uploadedBy === this.filter()),
  );
  protected readonly current = computed(() => {
    const i = this.index();
    return i === null ? null : (this.visible()[i] ?? null);
  });

  protected setFilter(f: Filter) {
    this.filter.set(f);
    this.index.set(null);
  }
  protected close() {
    this.index.set(null);
  }
  protected step(d: number) {
    const i = this.index();
    const n = this.visible().length;
    if (i !== null && n) this.index.set((i + d + n) % n);
  }

  @HostListener('document:keydown', ['$event'])
  protected onKey(e: KeyboardEvent) {
    if (this.index() === null) return;
    if (e.key === 'Escape') this.close();
    if (e.key === 'ArrowRight') this.step(1);
    if (e.key === 'ArrowLeft') this.step(-1);
  }
}
