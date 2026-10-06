import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FarmerDetail, FarmerFormValue } from '../../models/farmer.model';

type Field =
  | 'name'
  | 'email'
  | 'phone'
  | 'username'
  | 'password'
  | 'region'
  | 'farmName'
  | 'location';

@Component({
  selector: 'app-farmer-form',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './farmer-form.html',
  styleUrl: './farmer-form.scss',
})
export class FarmerForm {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly farmer = input<FarmerDetail | null>(null);
  readonly mode = input<'create' | 'edit'>('create');
  readonly regions = input<string[]>([]);
  readonly saving = input(false);
  readonly error = input<string | null>(null);
  readonly submitLabel = input('Save farmer');
  readonly submitted = output<FarmerFormValue>();
  readonly cancelled = output<void>();

  readonly regionOptions = computed(() => {
    const list = this.regions();
    const current = this.farmer()?.region;
    return current && !list.includes(current) ? [current, ...list] : list;
  });

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s-]{9,15}$/)]],
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    region: ['', Validators.required],
    farmName: ['', Validators.required],
    location: ['', Validators.required],
    farmDetails: [''],
  });

  constructor() {
    // username/password are only used when creating an account
    effect(() => {
      const edit = this.mode() === 'edit';
      for (const k of ['username', 'password'] as const) {
        const c = this.form.controls[k];
        edit ? c.disable({ emitEvent: false }) : c.enable({ emitEvent: false });
      }
    });
    effect(() => {
      const f = this.farmer();
      if (!f) return;
      this.form.patchValue({
        name: f.name,
        email: f.email,
        phone: f.phone,
        region: f.region,
        farmName: f.profile?.farmName ?? '',
        location: f.profile?.location ?? '',
        farmDetails: f.profile?.farmDetails ?? '',
      });
    });
  }

  invalid(name: Field) {
    const c = this.form.controls[name];
    return c.invalid && (c.dirty || c.touched);
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitted.emit(this.form.getRawValue());
  }
}
