import { Component, effect, inject, input, output, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  Driver,
  DriverFormValue,
  GHANA_REGIONS,
  ID_TYPES,
  IdType,
  KycStatus,
} from '../../models/driver.model';
import { VEHICLE_TYPES, VehicleType } from '../../models/vehicle.model';
import { DriverService } from '../../services/driver.service';

@Component({
  selector: 'app-driver-form',
  imports: [ReactiveFormsModule],
  templateUrl: './driver-form.html',
  styleUrl: './driver-form.scss',
})
export class DriverForm {
  private fb = inject(NonNullableFormBuilder);
  private svc = inject(DriverService);

  driver = input<Driver | null>(null);
  submitLabel = input('Save Driver');
  /** true when registering; false on edit (blank password = keep current one) */
  requirePassword = input(true);

  saved = output<DriverFormValue>();
  cancelled = output<void>();

  readonly regions = GHANA_REGIONS;
  readonly idTypes = ID_TYPES;
  readonly vehicleTypes = VEHICLE_TYPES;
  showPassword = signal(false);

  form = this.fb.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\s-]{9,15}$/)]],
      email: ['', [Validators.required, Validators.email]],
      region: ['', Validators.required],
      address: [''],

      username: [
        '',
        [
          Validators.required,
          Validators.minLength(4),
          Validators.pattern(/^[a-zA-Z0-9._-]+$/),
          (c: AbstractControl): ValidationErrors | null =>
            this.svc.usernameTaken(c.value ?? '', this.driver()?.id) ? { taken: true } : null,
        ],
      ],
      password: [''],
      confirmPassword: [''],

      idType: ['Ghana Card' as IdType, Validators.required],
      idNumber: ['', Validators.required],
      licenceNumber: ['', Validators.required],
      licenceExpiry: ['', Validators.required],
      kycStatus: ['pending' as KycStatus],

      vehicleType: ['Truck' as VehicleType, Validators.required],
      vehicleCapacity: ['', Validators.required],
      plateNumber: [
        '',
        [
          Validators.required,
          (c: AbstractControl): ValidationErrors | null =>
            this.svc.plateTaken(c.value ?? '', this.driver()?.id) ? { taken: true } : null,
        ],
      ],
      vehicleMake: [''],
    },
    {
      validators: [
        (g: AbstractControl): ValidationErrors | null =>
          g.get('password')?.value !== g.get('confirmPassword')?.value ? { mismatch: true } : null,
      ],
    },
  );

  constructor() {
    effect(() => {
      const d = this.driver();
      if (d) {
        this.form.patchValue({
          fullName: d.fullName,
          phone: d.phone,
          email: d.email,
          region: d.region,
          address: d.address,
          username: d.username ?? '',
          idType: d.idType,
          idNumber: d.idNumber,
          licenceNumber: d.licenceNumber,
          licenceExpiry: d.licenceExpiry,
          kycStatus: d.kycStatus,
          vehicleType: d.vehicle.type,
          vehicleCapacity: d.vehicle.capacity,
          plateNumber: d.vehicle.plateNumber,
          vehicleMake: d.vehicle.make,
        });
      }
    });

    effect(() => {
      const pw = this.form.controls.password;
      pw.setValidators(
        this.requirePassword()
          ? [Validators.required, Validators.minLength(8)]
          : [Validators.minLength(8)],
      );
      pw.updateValueAndValidity();
    });
  }

  invalid(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  mismatch(): boolean {
    const c = this.form.controls.confirmPassword;
    return this.form.hasError('mismatch') && (c.touched || c.dirty);
  }

  generatePassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%';
    const bytes = crypto.getRandomValues(new Uint32Array(12));
    const pw = Array.from(bytes, (b) => chars[b % chars.length]).join('');
    this.form.patchValue({ password: pw, confirmPassword: pw });
    this.form.controls.password.markAsDirty();
    this.showPassword.set(true);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { confirmPassword: _confirm, ...value } = this.form.getRawValue();
    this.saved.emit(value);
  }
}
