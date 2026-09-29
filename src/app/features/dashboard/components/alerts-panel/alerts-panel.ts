import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Panel } from '../../../../shared/components/panel/panel';
import { AlertItem } from '../../models/dashboard.model';

@Component({
  selector: 'app-alerts-panel',
  imports: [Panel, RouterLink],
  templateUrl: './alerts-panel.html',
  styleUrl: './alerts-panel.scss'
})
export class AlertsPanel {
  readonly alerts = input.required<AlertItem[]>();
}