import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { InspectorForm } from '../../components/inspector-form/inspector-form';
import { InspectorPayload } from '../../models/inspector.model';
import { InspectorService } from '../../services/inspector.service';

@Component({
  selector: 'app-edit-inspector',
  imports: [InspectorForm],
  templateUrl: './edit-inspector.html',
  styleUrl: './edit-inspector.scss',
})
export class EditInspector {
  private readonly service = inject(InspectorService);
  private readonly router = inject(Router);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected readonly inspector = computed(() => this.service.getById(this.id) ?? null);

  protected save(payload: InspectorPayload) {
    this.service.update(this.id, payload);
    this.router.navigate(['/inspectors', this.id]);
  }

  protected cancel() {
    this.router.navigate(['/inspectors']);
  }
}
