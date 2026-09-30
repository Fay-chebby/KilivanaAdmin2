import { Component, OnInit, inject, input, output } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ImageUpload } from '../image-upload/image-upload';
import {
  ID_TYPES,
  IdType,
  Inspector,
  InspectorCreatePayload,
  REGIONS,
  SPECIALIZATIONS,
} from '../../models/inspector.model';
import { InspectorService } from '../../services/inspector.service';

@Component({
  selector: 'app-inspector-form',
  imports: [ReactiveFormsModule, ImageUpload],
  templateUrl: './inspector-form.html',
  styleUrl: './inspector-form.scss',
})
export class InspectorForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(InspectorService);

  readonly inspector = input<Inspector | null>(null);
  readonly mode = input<'create' | 'edit'>('create');
  readonly submitLabel = input('Save inspector');
  readonly saved = output<InspectorCreatePayload>();
  readonly cancelled = output<void>();

  protected readonly specializations = SPECIALIZATIONS;
  protected readonly regions = REGIONS;
  protected readonly idTypes = ID_TYPES;

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^(\+254|0)[17]\d{8}$/)]],
    specialization: ['', Validators.required],
    region: ['', Validators.required],
    status: ['active' as InspectorCreatePayload['status'], Validators.required],
    temporaryPassword: ['', [Validators.required, Validators.minLength(8)]],
    kyc: this.fb.nonNullable.group({
      idType: ['national_id' as IdType, Validators.required],
      idNumber: ['', [Validators.required, Validators.minLength(5)]],
      dateOfBirth: ['', Validators.required],
      gender: ['male' as 'male' | 'female', Validators.required],
      address: ['', [Validators.required, Validators.minLength(5)]],
      emergencyName: ['', Validators.required],
      emergencyPhone: ['', [Validators.required, Validators.pattern(/^(\+254|0)[17]\d{8}$/)]],
      photoUrl: ['', Validators.required],
      idFrontUrl: ['', Validators.required],
      idBackUrl: ['', Validators.required],
    }),
    idSighted: [false, Validators.requiredTrue],
  });

  ngOnInit() {
    const i = this.inspector();
    if (this.mode() === 'edit') {
      this.form.controls.temporaryPassword.disable();
    } else {
      this.generate();
    }
    if (i) this.form.patchValue({ ...i, idSighted: !!i.kyc.verifiedAt });
  }

  protected generate() {
    this.form.controls.temporaryPassword.setValue(this.service.generatePassword());
  }

  protected bad(c: AbstractControl) {
    return c.invalid && (c.touched || c.dirty);
  }

  protected setImage(name: 'photoUrl' | 'idFrontUrl' | 'idBackUrl', url: string) {
    const c = this.form.controls.kyc.controls[name];
    c.setValue(url);
    c.markAsTouched();
  }

  protected submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      document
        .querySelector('.err, .invalid')
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    this.saved.emit(this.form.getRawValue());
  }
}
