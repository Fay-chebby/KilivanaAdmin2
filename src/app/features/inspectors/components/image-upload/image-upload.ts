import { Component, input, output, signal } from '@angular/core';

const MAX_MB = 5;

@Component({
  selector: 'app-image-upload',
  templateUrl: './image-upload.html',
  styleUrl: './image-upload.scss',
})
export class ImageUpload {
  readonly label = input.required<string>();
  readonly hint = input('JPG or PNG, up to 5 MB');
  readonly value = input('');
  readonly invalid = input(false);
  readonly changed = output<string>();

  protected readonly error = signal('');

  protected onPick(event: Event) {
    const el = event.target as HTMLInputElement;
    const file = el.files?.[0];
    el.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.error.set('Choose an image file.');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      this.error.set(`Image must be under ${MAX_MB} MB.`);
      return;
    }
    this.error.set('');
    const reader = new FileReader();
    reader.onload = () => this.changed.emit(reader.result as string);
    reader.readAsDataURL(file);
    // Real API: upload `file` as multipart FormData and emit the returned URL instead.
  }
}
