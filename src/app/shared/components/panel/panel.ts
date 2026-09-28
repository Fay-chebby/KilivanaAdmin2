import { Component, input } from '@angular/core';

/** White card with a title. Put extra header content (legend, buttons) in [panel-actions]. */
@Component({
  selector: 'app-panel',
  templateUrl: './panel.html',
  styleUrl: './panel.scss',
})
export class Panel {
  readonly title = input.required<string>();
  readonly subtitle = input('');
}
