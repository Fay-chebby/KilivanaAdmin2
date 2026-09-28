import { Component, input } from '@angular/core';
import { Icon } from '../icon/icon';

export type StatTone = 'green' | 'amber' | 'red' | 'blue';

/**
 * variant="default" -> big card (label + icon on top, big value, delta below)
 * variant="mini"    -> compact card (tinted icon on the left, label + value)
 */
@Component({
  selector: 'app-stat-card',
  imports: [Icon],
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.scss',
})
export class StatCard {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly icon = input.required<string>();
  readonly delta = input('');
  readonly positive = input(true);
  readonly variant = input<'default' | 'mini'>('default');
  readonly tone = input<StatTone>('green');
}
