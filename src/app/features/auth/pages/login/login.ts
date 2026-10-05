import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Icon } from '../../../../shared/components/icon/icon';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, Icon],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);

        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';

        this.router.navigateByUrl(returnUrl);
      },

      error: (err) => {
        this.loading.set(false);

        console.error('Login error:', err);

        if (err.status === 0) {
          this.errorMessage.set(
            'Unable to reach the login server. This may be a network or CORS issue.',
          );
        } else if (err.status === 400) {
          this.errorMessage.set(err.error?.message || 'Invalid login request.');
        } else if (err.status === 401) {
          this.errorMessage.set('Invalid email or password.');
        } else if (err.status === 403) {
          this.errorMessage.set('Login is not allowed. Please contact the administrator.');
        } else if (err.status === 404) {
          this.errorMessage.set('Login endpoint was not found on the server.');
        } else if (err.status >= 500) {
          this.errorMessage.set('The server encountered an error. Please try again later.');
        } else {
          this.errorMessage.set(err.error?.message || 'Login failed. Please try again.');
        }
      },
    });
  }
}
