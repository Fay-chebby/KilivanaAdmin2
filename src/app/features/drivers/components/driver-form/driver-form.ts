import { Component, effect, inject, input, output, signal } from '@angular/core';

import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  Driver,
  DriverFormValue,
  KENYA_COUNTIES,
  ID_TYPES,
  IdType,
  KycStatus,
} from '../../models/driver.model';

import { VEHICLE_TYPES, VehicleType } from '../../models/vehicle.model';

@Component({
  selector: 'app-driver-form',
  imports: [ReactiveFormsModule],
  templateUrl: './driver-form.html',
  styleUrl: './driver-form.scss',
})
export class DriverForm {
  private readonly fb = inject(NonNullableFormBuilder);

  driver = input<Driver | null>(null);

  submitLabel = input('Save Driver');

  /**
   * true when registering a new driver.
   * false when editing an existing driver.
   */
  requirePassword = input(true);

  saved = output<DriverFormValue>();
  cancelled = output<void>();

  readonly regions = KENYA_COUNTIES;
  readonly idTypes = ID_TYPES;
  readonly vehicleTypes = VEHICLE_TYPES;

  showPassword = signal(false);

  form = this.fb.group(
    {
      // -----------------------------------------
      // Personal details
      // -----------------------------------------

      fullName: ['', [Validators.required, Validators.minLength(2)]],

      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\s-]{9,15}$/)]],

      email: ['', [Validators.required, Validators.email]],

      region: ['', Validators.required],

      address: [''],

      // -----------------------------------------
      // Login credentials
      // -----------------------------------------

      username: [
        '',
        [Validators.required, Validators.minLength(4), Validators.pattern(/^[a-zA-Z0-9._-]+$/)],
      ],

      password: [''],

      confirmPassword: [''],

      // -----------------------------------------
      // KYC & licence
      // -----------------------------------------

      idType: ['National ID' as IdType, Validators.required],

      idNumber: ['', Validators.required],

      licenceNumber: ['', Validators.required],

      licenceExpiry: ['', Validators.required],

      kycStatus: ['pending' as KycStatus],

      // -----------------------------------------
      // Vehicle
      // -----------------------------------------

      vehicleType: ['Truck' as VehicleType, Validators.required],

      vehicleCapacity: ['', Validators.required],

      plateNumber: ['', Validators.required],

      vehicleMake: [''],
    },

    {
      validators: [
        (group) => {
          const password = group.get('password')?.value;

          const confirmPassword = group.get('confirmPassword')?.value;

          return password !== confirmPassword ? { mismatch: true } : null;
        },
      ],
    },
  );

  constructor() {
    /**
     * Populate form when editing an existing driver.
     */
    effect(() => {
      const d = this.driver();

      if (!d) {
        return;
      }

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
    });

    /**
     * Password is required during registration,
     * but optional during editing.
     */
    effect(() => {
      const passwordControl = this.form.controls.password;

      passwordControl.setValidators(
        this.requirePassword()
          ? [Validators.required, Validators.minLength(8)]
          : [Validators.minLength(8)],
      );

      passwordControl.updateValueAndValidity();
    });
  }

  /**
   * Check whether a field is invalid and
   * has already been interacted with.
   */
  invalid(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];

    return control.invalid && (control.touched || control.dirty);
  }

  /**
   * Check password confirmation.
   */
  mismatch(): boolean {
    const control = this.form.controls.confirmPassword;

    return this.form.hasError('mismatch') && (control.touched || control.dirty);
  }

  /**
   * Generate a strong random password.
   */
  generatePassword(): void {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%';

    const bytes = crypto.getRandomValues(new Uint32Array(12));

    const password = Array.from(bytes, (byte) => chars[byte % chars.length]).join('');

    this.form.patchValue({
      password,
      confirmPassword: password,
    });

    this.form.controls.password.markAsDirty();

    this.showPassword.set(true);
  }

  /**
   * Submit the form.
   */
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { confirmPassword: _confirmPassword, ...value } = this.form.getRawValue();

    this.saved.emit(value);
  }
}
