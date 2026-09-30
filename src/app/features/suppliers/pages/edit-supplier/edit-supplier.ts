import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SupplierForm } from '../../components/supplier-form/supplier-form';
import { SupplierFormValue } from '../../models/supplier.model';
import { SupplierService } from '../../services/supplier.service';

@Component({
  selector: 'app-edit-supplier',
  imports: [RouterLink, SupplierForm],
  templateUrl: './edit-supplier.html',
  styleUrl: './edit-supplier.scss',
})
export class EditSupplier {
  private svc = inject(SupplierService);
  private router = inject(Router);
  private id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  supplier = this.svc.getById(this.id) ?? null;

  save(value: SupplierFormValue) {
    this.svc.update(this.id, value);
    this.router.navigate(['/suppliers', this.id]);
  }

  cancel() {
    this.router.navigate(['/suppliers']);
  }
}