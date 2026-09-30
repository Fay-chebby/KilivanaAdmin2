import { Component, effect, inject, input, output, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  SUPPLIER_CATEGORIES,
  Supplier,
  SupplierCategory,
  SupplierFormValue,
  SupplierStatus,
} from '../../models/supplier.model';
import { SupplierService } from '../../services/supplier.service';

@Component({
  selector: 'app-supplier-form',
  imports: [ReactiveFormsModule],
  templateUrl: './supplier-form.html',
  styleUrl: './supplier-form.scss',
})
export class SupplierForm {
  private fb = inject(NonNullableFormBuilder);
  private svc = inject(SupplierService);

  supplier = input<Supplier | null>(null);
  submitLabel = input('Save Supplier');
  /** Show the initial-status dropdown (only when registering a new supplier) */
  showStatus = input(false);
  /** true when registering; false on edit (blank password = keep current one) */
  requirePassword = input(true);

  saved = output<SupplierFormValue>();
  cancelled = output<void>();

  readonly categories = SUPPLIER_CATEGORIES;
  showPassword = signal(false);

  form = this.fb.group(
    {
      name: ['', [Validators.required, Validators.minLength(2)]],
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(4),
          Validators.pattern(/^[a-zA-Z0-9._-]+$/),
          (c: AbstractControl): ValidationErrors | null =>
            this.svc.usernameTaken(c.value ?? '', this.supplier()?.id) ? { taken: true } : null,
        ],
      ],
      password: [''],
      confirmPassword: [''],
      category: ['Fertilizers & Seeds' as SupplierCategory, Validators.required],
      contactPerson: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\s-]{9,15}$/)]],
      region: ['', Validators.required],
      address: [''],
      contractEnd: [''],
      status: ['pending' as SupplierStatus],
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
      const s = this.supplier();
      if (s) {
        this.form.patchValue({ ...s, username: s.username ?? '', contractEnd: s.contractEnd ?? '' });
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