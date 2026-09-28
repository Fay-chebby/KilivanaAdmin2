import { Component, input } from '@angular/core';

/** Breadcrumb + page title. Anything projected inside sits on the right (e.g. "Last updated"). */
@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.html',
  styleUrl: './page-header.scss',
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly breadcrumb = input<string[]>([]);
}
