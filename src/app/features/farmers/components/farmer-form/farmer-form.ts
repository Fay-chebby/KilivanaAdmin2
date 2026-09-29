import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Farmer, FarmerFormValue, KENYA_COUNTIES } from '../../models/farmer.model';

@Component({
  selector: 'app-farmer-form',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './farmer-form.html',
  styleUrl: './farmer-form.scss',
})
export class FarmerForm {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly farmer = input<Farmer | null>(null);
  readonly submitLabel = input('Save farmer');
  readonly submitted = output<FarmerFormValue>();
  readonly cancelled = output<void>();
  readonly regions = KENYA_COUNTIES;

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s-]{9,15}$/)]],
    region: ['', Validators.required],
    crops: ['', Validators.required], // comma separated
  });

  constructor() {
    effect(() => {
      const f = this.farmer();
      if (f) this.form.patchValue({ ...f, crops: f.crops.join(', ') });
    });
  }

  invalid(name: 'name' | 'email' | 'phone' | 'region' | 'crops') {
    const c = this.form.controls[name];
    return c.invalid && (c.dirty || c.touched);
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.submitted.emit({
      ...v,
      crops: v.crops
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
    });
  }
}
