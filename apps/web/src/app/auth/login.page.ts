import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import {
  ISignInFormOptions,
  ISignInFormSubmit,
  SignInFormComponent,
} from '@smartsoft001/angular';

import { LoginService } from './login.service';

@Component({
  selector: 'app-login',
  imports: [SignInFormComponent],
  template: `
    <h1>Sign in</h1>
    <smart-sign-in-form
      [disabled]="pending()"
      [options]="options"
      (submit)="onSubmit($event)"
    />
    @if (error()) {
      <p role="alert" class="app-login__error">{{ error() }}</p>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly loginService = inject(LoginService);
  private readonly router = inject(Router);

  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);

  /** The seeded user name is an email, so the form's email input fits. */
  protected readonly options: ISignInFormOptions = {
    showLabels: true,
    submitLabel: 'Sign in',
    emailPlaceholder: 'admin@example.com',
  };

  protected async onSubmit({
    email,
    password,
  }: ISignInFormSubmit): Promise<void> {
    this.pending.set(true);
    this.error.set(null);

    try {
      await this.loginService.signIn(email, password);
      await this.router.navigateByUrl('/notes');
    } catch (error) {
      this.error.set((error as Error).message);
    } finally {
      this.pending.set(false);
    }
  }
}
