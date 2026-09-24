import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '@smartsoft001/angular';

/** Client registered in the API's `tokenConfig.clients`. */
export const AUTH_CLIENT_ID = 'example-app';
export const TOKEN_URL = '/api/token';

interface ITokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expired_in: number;
  username: string;
}

@Injectable({ providedIn: 'root' })
export class LoginService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  /**
   * Runs the OAuth password grant against the API and stores the returned token.
   * Rejects with the API's `details` message (or a generic one) on failure.
   */
  async signIn(username: string, password: string): Promise<void> {
    try {
      const token = await firstValueFrom(
        this.http.post<ITokenResponse>(TOKEN_URL, {
          grant_type: 'password',
          username,
          password,
          client_id: AUTH_CLIENT_ID,
        }),
      );

      this.authService.setToken(token);
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  signOut(): void {
    this.authService.removeToken();
  }

  private getErrorMessage(error: unknown): string {
    const details =
      error instanceof HttpErrorResponse ? error.error?.details : null;

    return typeof details === 'string' ? details : 'Sign-in failed';
  }
}
