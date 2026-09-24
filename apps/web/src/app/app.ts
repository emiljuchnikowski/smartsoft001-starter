import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterOutlet,
} from '@angular/router';
import { filter, map } from 'rxjs';

import { AuthService } from '@smartsoft001/angular';

import { LoginService } from './auth/login.service';

@Component({
  imports: [RouterLink, RouterOutlet],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly authService = inject(AuthService);
  private readonly loginService = inject(LoginService);
  private readonly router = inject(Router);

  /** Recomputed after every navigation, which is when the token can change. */
  protected readonly authenticated = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.authService.isAuthenticated()),
    ),
    { initialValue: this.authService.isAuthenticated() },
  );

  protected signOut(): void {
    this.loginService.signOut();
    this.router.navigateByUrl('/login');
  }
}
