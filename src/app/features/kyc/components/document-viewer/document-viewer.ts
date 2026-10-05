import { Component, input } from '@angular/core';
import { KycDocument } from '../../models/kyc.model';

@Component({
  selector: 'app-document-viewer',
  standalone: true,
  templateUrl: './document-viewer.html',
  styleUrl: './document-viewer.scss',
})
export class DocumentViewer {
  doc = input<KycDocument | null>(null);
  height = input('180px');
}
