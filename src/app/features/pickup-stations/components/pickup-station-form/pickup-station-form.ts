import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-pickup-station-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './pickup-station-form.html',
  styleUrl: './pickup-station-form.scss',
})
export class PickupStationForm {
  @Input({ required: true }) form!: FormGroup;
  @Input() isSubmitting = false;
  @Input() submitLabel = 'Save Pickup Station';

  @Output() submitted = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  getControlError(controlName: string): string {
    const control = this.form.get(controlName);

    if (!control || !control.touched || !control.errors) {
      return '';
    }

    if (control.hasError('required')) {
      return 'This field is required.';
    }

    if (control.hasError('minlength')) {
      return 'Please enter at least 3 characters.';
    }

    if (control.hasError('min') || control.hasError('max')) {
      return 'Please enter a valid value.';
    }

    return 'Please enter a valid value.';
  }
}
