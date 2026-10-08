import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SupplierForm } from '../../components/supplier-form/supplier-form';
import { Supplier, SupplierFormValue } from '../../models/supplier.model';
import { SupplierService, errorMessage } from '../../services/supplier.service';

@Component({
  selector: 'app-edit-supplier',
  imports: [RouterLink, SupplierForm],
  templateUrl: './edit-supplier.html',
  styleUrl: './edit-supplier.scss',
})
export class EditSupplier {
  private svc = inject(SupplierService);
  private router = inject(Router);
  private id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  supplier = signal<Supplier | null>(null);
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);

  constructor() {
    this.svc.get$(this.id).subscribe({
      next: (s) => {
        this.supplier.set(s);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  save(value: SupplierFormValue) {
    this.saving.set(true);
    this.error.set(null);
    this.svc.update$(this.id, value).subscribe({
      next: () => this.router.navigate(['/suppliers', this.id]),
      error: (e) => {
        this.error.set(errorMessage(e));
        this.saving.set(false);
      },
    });
  }

  cancel() {
    this.router.navigate(['/suppliers']);
  }
}
