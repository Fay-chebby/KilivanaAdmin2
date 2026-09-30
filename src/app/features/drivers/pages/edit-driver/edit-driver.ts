import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DriverForm } from '../../components/driver-form/driver-form';
import { DriverFormValue } from '../../models/driver.model';
import { DriverService } from '../../services/driver.service';

@Component({
  selector: 'app-edit-driver',
  imports: [RouterLink, DriverForm],
  templateUrl: './edit-driver.html',
  styleUrl: './edit-driver.scss',
})
export class EditDriver {
  private svc = inject(DriverService);
  private router = inject(Router);
  private id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  driver = this.svc.getById(this.id) ?? null;

  save(value: DriverFormValue) {
    this.svc.update(this.id, value);
    this.router.navigate(['/drivers', this.id]);
  }

  cancel() {
    this.router.navigate(['/drivers']);
  }
}
