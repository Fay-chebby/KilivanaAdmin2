import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../../../shared/components/icon/icon';
import { Panel } from '../../../../shared/components/panel/panel';
import { TimeAgoPipe } from '../../../../shared/pipes/time-ago-pipe';
import { ActivityItem } from '../../models/dashboard.model';

@Component({
  selector: 'app-activity-list',
  imports: [Panel, Icon, RouterLink, TimeAgoPipe],
  templateUrl: './activity-list.html',
  styleUrl: './activity-list.scss'
})
export class ActivityList {
  readonly items = input.required<ActivityItem[]>();

  protected readonly meta: Record<ActivityItem['type'], { icon: string; tone: string }> = {
    order: { icon: 'cart', tone: 'blue' },
    kyc: { icon: 'clock', tone: 'amber' },
    dispute: { icon: 'alert', tone: 'red' }
  };
}