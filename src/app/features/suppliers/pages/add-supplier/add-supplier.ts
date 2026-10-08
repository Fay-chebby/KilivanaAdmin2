import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SupplierForm } from '../../components/supplier-form/supplier-form';
import { SupplierFormValue } from '../../models/supplier.model';
import { SupplierService, errorMessage } from '../../services/supplier.service';

@Component({
  selector: 'app-add-supplier',
  imports: [RouterLink, SupplierForm],
  templateUrl: './add-supplier.html',
  styleUrl: './add-supplier.scss',
})
export class AddSupplier {
  private svc = inject(SupplierService);
  private router = inject(Router);

  saving = signal(false);
  error = signal<string | null>(null);

  save(value: SupplierFormValue) {
    this.saving.set(true);
    this.error.set(null);
    this.svc.create$(value).subscribe({
      next: () => this.router.navigate(['/suppliers']),
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
