import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DriverForm } from '../../components/driver-form/driver-form';
import { DriverFormValue } from '../../models/driver.model';
import { DriverService } from '../../services/driver.service';

@Component({
  selector: 'app-add-driver',
  imports: [RouterLink, DriverForm],
  templateUrl: './add-driver.html',
  styleUrl: './add-driver.scss',
})
export class AddDriver {
  private svc = inject(DriverService);
  private router = inject(Router);

  save(value: DriverFormValue) {
    this.svc.create(value);
    this.router.navigate(['/drivers']);
  }

  cancel() {
    this.router.navigate(['/drivers']);
  }
}
