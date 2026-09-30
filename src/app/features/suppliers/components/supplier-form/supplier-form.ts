import { Component, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  SUPPLIER_CATEGORIES,
  Supplier,
  SupplierCategory,
  SupplierFormValue,
  SupplierStatus,
} from '../../models/supplier.model';

@Component({
  selector: 'app-supplier-form',
  imports: [ReactiveFormsModule],
  templateUrl: './supplier-form.html',
  styleUrl: './supplier-form.scss',
})
export class SupplierForm {
  private fb = inject(NonNullableFormBuilder);

  supplier = input<Supplier | null>(null);
  submitLabel = input('Save Supplier');
  /** Show the initial-status dropdown (only when registering a new supplier) */
  showStatus = input(false);

  saved = output<SupplierFormValue>();
  cancelled = output<void>();

  readonly categories = SUPPLIER_CATEGORIES;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    category: ['Fertilizers & Seeds' as SupplierCategory, Validators.required],
    contactPerson: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+\s-]{9,15}$/)]],
    region: ['', Validators.required],
    address: [''],
    contractEnd: [''],
    status: ['pending' as SupplierStatus],
  });

  constructor() {
    effect(() => {
      const s = this.supplier();
      if (s) {
        this.form.patchValue({ ...s, contractEnd: s.contractEnd ?? '' });
      }
    });
  }

  invalid(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saved.emit(this.form.getRawValue());
  }
}
