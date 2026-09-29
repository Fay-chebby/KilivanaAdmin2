import { Component, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { NAV_SECTIONS } from '../../../core/config/nav.config';
import { NavSection } from '../../../core/models/nav-item.model';
import { Icon } from '../../../shared/components/icon/icon';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, Icon],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  private readonly router = inject(Router);

  /** Icon-rail mode, controlled by the topbar hamburger via AdminLayout. */
  readonly collapsed = input(false);

  readonly sections = NAV_SECTIONS;
  private readonly open = signal<ReadonlySet<string>>(new Set());

  constructor() {
    this.expandFor(this.router.url);
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => this.expandFor(e.urlAfterRedirects));
  }

  isOpen(section: NavSection): boolean {
    return this.open().has(section.label);
  }

  toggle(section: NavSection): void {
    this.open.update((current) => {
      const next = new Set(current);
      next.has(section.label) ? next.delete(section.label) : next.add(section.label);
      return next;
    });
  }

  /** Keeps the section that contains the current page open. */
  private expandFor(url: string): void {
    const section = NAV_SECTIONS.find((s) => s.items.some((i) => url.startsWith(i.route)));
    if (section) this.open.update((current) => new Set(current).add(section.label));
  }
}
