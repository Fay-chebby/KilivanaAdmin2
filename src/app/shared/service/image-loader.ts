import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ImageLoader {
  private readonly http = inject(HttpClient);

  private readonly headers = new HttpHeaders({
    'ngrok-skip-browser-warning': 'true',
  });

  private readonly objectUrls = new Map<string, string>();

  async load(url: string): Promise<string> {
    const cleanUrl = url.trim();

    if (!cleanUrl) {
      throw new Error('Image URL is empty.');
    }

    const blob = await firstValueFrom(
      this.http.get(cleanUrl, {
        headers: this.headers,
        responseType: 'blob',
      }),
    );

    if (!blob.type.startsWith('image/')) {
      throw new Error(`Expected an image, but received ${blob.type || 'an unknown content type'}.`);
    }

    const objectUrl = URL.createObjectURL(blob);
    this.objectUrls.set(cleanUrl, objectUrl);

    return objectUrl;
  }

  revoke(url: string): void {
    const objectUrl = this.objectUrls.get(url.trim());

    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      this.objectUrls.delete(url.trim());
    }
  }
}
