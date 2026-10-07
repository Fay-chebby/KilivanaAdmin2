import { Component, OnInit, inject, input, output } from '@angular/core';

import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';

import {
  Inspector,
  InspectorCreatePayload,
  InspectorPayload,
  REGIONS,
  SPECIALIZATIONS,
  InspectorStatus,
} from '../../models/inspector.model';

import { InspectorService } from '../../services/inspector.service';

@Component({
  selector: 'app-inspector-form',
  imports: [ReactiveFormsModule],
  templateUrl: './inspector-form.html',
  styleUrl: './inspector-form.scss',
})
export class InspectorForm implements OnInit {
  private readonly fb = inject(FormBuilder);

  private readonly service = inject(InspectorService);

  readonly inspector = input<Inspector | null>(null);

  readonly mode = input<'create' | 'edit'>('create');

  readonly submitLabel = input('Save inspector');

  readonly saved = output<InspectorCreatePayload | InspectorPayload>();

  readonly cancelled = output<void>();

  protected readonly specializations = SPECIALIZATIONS;

  protected readonly regions = REGIONS;

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],

    email: ['', [Validators.required, Validators.email]],

    phone: ['', [Validators.required, Validators.pattern(/^(\+254|0)[17]\d{8}$/)]],

    specialization: ['', Validators.required],

    region: ['', Validators.required],

    assignedArea: ['', [Validators.required, Validators.minLength(2)]],

    inspectorDetails: ['', [Validators.required, Validators.minLength(2)]],

    status: ['active' as InspectorStatus, Validators.required],

    temporaryPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit(): void {
    const inspector = this.inspector();

    if (this.mode() === 'edit') {
      this.form.controls.temporaryPassword.clearValidators();

      this.form.controls.temporaryPassword.disable();
      this.form.controls.temporaryPassword.updateValueAndValidity();
    } else {
      this.generate();
    }

    if (inspector) {
      this.form.patchValue({
        name: inspector.name,
        email: inspector.email,
        phone: inspector.phone,
        specialization: inspector.specialization,
        region: inspector.region,
        assignedArea: inspector.assignedArea,
        inspectorDetails: inspector.inspectorDetails,
        status: inspector.status,
      });
    }
  }

  protected generate(): void {
    this.form.controls.temporaryPassword.setValue(this.service.generatePassword());
  }

  protected bad(control: AbstractControl): boolean {
    return control.invalid && (control.touched || control.dirty);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      document.querySelector('.err, .invalid')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });

      return;
    }

    const value = this.form.getRawValue();

    if (this.mode() === 'create') {
      this.saved.emit({
        name: value.name,
        email: value.email,
        phone: value.phone,
        specialization: value.specialization,
        region: value.region,
        assignedArea: value.assignedArea,
        inspectorDetails: value.inspectorDetails,
        status: value.status,
        temporaryPassword: value.temporaryPassword,
      });

      return;
    }

    this.saved.emit({
      name: value.name,
      email: value.email,
      phone: value.phone,
      specialization: value.specialization,
      region: value.region,
      assignedArea: value.assignedArea,
      inspectorDetails: value.inspectorDetails,
      status: value.status,
    });
  }
}
