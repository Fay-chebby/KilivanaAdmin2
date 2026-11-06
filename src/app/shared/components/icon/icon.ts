import { Component, computed, input } from '@angular/core';

/** Helper that draws a circle as an SVG path. */
const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

/** Every icon is a list of SVG path strings on a 24x24 grid. Add new icons here. */
export const ICONS: Record<string, string[]> = {
  grid: ['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M3 14h7v7H3z', 'M14 14h7v7h-7z'],
  user: [circle(12, 8, 4), 'M4 21c1.2-4 4.2-6 8-6s6.8 2 8 6'],
  cart: [
    'M3 3h2l2.4 11.1a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 7H6',
    circle(9.5, 20.5, 0.6),
    circle(17.5, 20.5, 0.6),
  ],
  box: ['M3 8.5L12 4l9 4.5-9 4.5z', 'M3 8.5V16l9 4.5 9-4.5V8.5', 'M12 13v7.5'],
  'shield-check': ['M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z', 'M8.5 12l2.5 2.5 4.5-5'],
  send: ['M21 3L3 10.5l7 2.5 2.5 7z'],
  leaf: ['M4 20c8 0 15-6 16-16-9 1-16 7-16 16z', 'M4 20c0-5 2.5-8 6-10'],
  card: ['M2 6h20v12H2z', 'M2 10h20'],
  compass: [circle(12, 12, 9), 'M15 9l-4 6-2-2z'],
  flag: ['M5 21V4', 'M5 4h13l-3 4.5 3 4.5H5'],
  chart: ['M4 20V10', 'M11 20V4', 'M18 20v-7'],
  lock: ['M5 10h14v10H5z', 'M8 10V7a4 4 0 0 1 8 0v3'],
  bell: ['M6 10a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z', 'M10 20a2 2 0 0 0 4 0'],
  trend: ['M3 17l6-6 4 4 8-8', 'M15 7h6v6'],
  clock: [circle(12, 12, 9), 'M12 7v5l3 3'],
  alert: ['M12 3L2 20h20z', 'M12 10v4', 'M12 17.2v.1'],
  search: [circle(11, 11, 7), 'M21 21l-4.3-4.3'],
  menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  'chevron-down': ['M6 9l6 6 6-6'],
  check: ['M5 12l4 4L19 6'],

  suppliers: [
    circle(9, 8, 3),
    circle(17, 9, 2.5),
    'M3 21c.5-4 2.8-6 6-6s5.5 2 6 6',
    'M14 15c2.8.2 4.8 2.2 5.5 6',
  ],

  ban: [circle(12, 12, 9), 'M6 6l12 12'],
  users: [circle(12, 8, 3), 'M5 21c.7-4 3.2-6 7-6s6.3 2 7 6', 'M17 14l1.5 1.5L21 13'],
  truck: ['M3 6h11v11H3z', 'M14 10h4l3 3v4h-7z', circle(7, 19, 1.5), circle(18, 19, 1.5)],
  farm: ['M3 21V10l9-7 9 7v11', 'M7 21v-6h10v6', 'M9 15v6', 'M15 15v6'],

  map: ['M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z', 'M9 3v15', 'M15 6v15'],

  // Verification and KYC icons
  file: ['M6 2h8l5 5v15H6z', 'M14 2v6h5', 'M9 13h7', 'M9 17h7'],

  'file-check': ['M6 2h8l5 5v15H6z', 'M14 2v6h5', 'M9 14l2 2 4-4'],

  'file-text': ['M6 2h8l5 5v15H6z', 'M14 2v6h5', 'M9 13h7', 'M9 17h5'],

  'user-check': [circle(9, 8, 4), 'M3 21c1-4 3-6 6-6 2 0 3.5 1 4.5 2.5', 'M16 18l2 2 4-4'],

  'shield-alert': ['M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z', 'M12 8v5', 'M12 16h.01'],

  'user-x': [circle(9, 8, 4), 'M3 21c1-4 3-6 6-6', 'M16 16l5 5', 'M21 16l-5 5'],

  eye: ['M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z', circle(12, 12, 3)],

  download: ['M12 3v12', 'M7 10l5 5 5-5', 'M4 21h16'],

  upload: ['M12 16V4', 'M7 9l5-5 5 5', 'M4 20h16'],

  calendar: ['M4 5h16v16H4z', 'M8 3v4', 'M16 3v4', 'M4 10h16'],

  filter: ['M4 5h16', 'M7 12h10', 'M10 19h4'],

  refresh: [
    'M20 7v5h-5',
    'M4 17v-5h5',
    'M5.5 9a7 7 0 0 1 12-2L20 12',
    'M4 12l2.5 5a7 7 0 0 0 12-2',
  ],

  'arrow-left': ['M19 12H5', 'M12 19l-7-7 7-7'],

  'arrow-right': ['M5 12h14', 'M12 5l7 7-7 7'],

  'external-link': ['M14 3h7v7', 'M10 14L21 3', 'M18 13v7H4V6h7'],

  'more-horizontal': [circle(5, 12, 1), circle(12, 12, 1), circle(19, 12, 1)],

  building: [
    'M3 21h18',
    'M5 21V5l7-3 7 3v16',
    'M9 9h1',
    'M14 9h1',
    'M9 13h1',
    'M14 13h1',
    'M10 21v-4h4v4',
  ],
};

@Component({
  selector: 'app-icon',
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      @for (d of paths(); track $index) {
        <path [attr.d]="d" />
      }
    </svg>
  `,
  styles: [':host { display: inline-flex; line-height: 0; flex-shrink: 0; }'],
})
export class Icon {
  readonly name = input.required<string>();
  readonly size = input(16);

  protected readonly paths = computed(() => ICONS[this.name()] ?? []);
}
