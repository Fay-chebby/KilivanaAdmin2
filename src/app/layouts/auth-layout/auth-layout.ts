import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Plain centered shell for login / forgot-password — no sidebar, no topbar. */
@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.scss',
})
export class AuthLayout {}
