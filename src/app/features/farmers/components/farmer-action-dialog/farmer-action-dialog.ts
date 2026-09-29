import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Farmer, FarmerAction, avatarColor, initials } from '../../models/farmer.model';

const CONFIG: Record<
  FarmerAction,
  { title: string; confirm: string; danger: boolean; needsReason: boolean; placeholder: string }
> = {
  approve: {
    title: 'Approve Farmer',
    confirm: 'Confirm Approval',
    danger: false,
    needsReason: false,
    placeholder: '',
  },
  reject: {
    title: 'Reject Farmer',
    confirm: 'Confirm Rejection',
    danger: true,
    needsReason: true,
    placeholder: 'Provide a clear reason that will be communicated to the farmer…',
  },
  suspend: {
    title: 'Suspend Farmer',
    confirm: 'Confirm Suspension',
    danger: true,
    needsReason: true,
    placeholder: 'Explain why this farmer is being suspended…',
  },
  reinstate: {
    title: 'Reinstate Farmer',
    confirm: 'Confirm Reinstatement',
    danger: false,
    needsReason: false,
    placeholder: '',
  },
};

@Component({
  selector: 'app-farmer-action-dialog',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './farmer-action-dialog.html',
  styleUrl: './farmer-action-dialog.scss',
})
export class FarmerActionDialog {
  readonly farmer = input.required<Farmer>();
  readonly action = input.required<FarmerAction>();
  readonly confirmed = output<string>();
  readonly cancelled = output<void>();

  readonly reason = signal('');
  readonly cfg = computed(() => CONFIG[this.action()]);
  readonly canConfirm = computed(() => !this.cfg().needsReason || this.reason().trim().length > 0);
  readonly initials = computed(() => initials(this.farmer().name));
  readonly color = computed(() => avatarColor(this.farmer().name));

  submit() {
    if (this.canConfirm()) this.confirmed.emit(this.reason().trim());
  }
}
