import { Component, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-credentials-modal',
  templateUrl: './credentials-modal.html',
  styleUrl: './credentials-modal.scss',
})
export class CredentialsModal {
  readonly title = input('Login details');
  readonly name = input.required<string>();
  readonly email = input.required<string>();
  readonly password = input.required<string>();
  readonly done = output<void>();

  protected readonly copied = signal(false);

  protected async copy() {
    const text = `Email: ${this.email()}\nTemporary password: ${this.password()}`;
    try {
      await navigator.clipboard.writeText(text);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      /* clipboard blocked: the details are visible on screen */
    }
  }
}
