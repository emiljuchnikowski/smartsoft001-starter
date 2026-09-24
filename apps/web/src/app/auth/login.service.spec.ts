import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AuthService } from '@smartsoft001/angular';

import { AUTH_CLIENT_ID, LoginService, TOKEN_URL } from './login.service';

describe('LoginService', () => {
  const username = 'admin@example.com';
  const password = 'placeholder-password';
  const tokenResponse = {
    access_token: 'placeholder-access-token',
    refresh_token: 'placeholder-refresh-token',
    token_type: 'bearer',
    expired_in: 3600,
    username,
  };

  let service: LoginService;
  let httpMock: HttpTestingController;
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(LoginService);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should post the password grant to the token endpoint', async () => {
    const result = service.signIn(username, password);

    const request = httpMock.expectOne(TOKEN_URL);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      grant_type: 'password',
      username,
      password,
      client_id: AUTH_CLIENT_ID,
    });

    request.flush(tokenResponse);
    await expect(result).resolves.toBeUndefined();
  });

  it('should store the returned token', async () => {
    const setToken = jest.spyOn(authService, 'setToken');

    const result = service.signIn(username, password);
    httpMock.expectOne(TOKEN_URL).flush(tokenResponse);
    await result;

    expect(setToken).toHaveBeenCalledWith(tokenResponse);
  });

  it('should reject with the API message when the credentials are invalid', async () => {
    const result = service.signIn(username, password);

    httpMock
      .expectOne(TOKEN_URL)
      .flush(
        { details: 'Invalid username or password' },
        { status: 400, statusText: 'Bad Request' },
      );

    await expect(result).rejects.toThrow('Invalid username or password');
  });

  it('should reject with a generic message for other errors', async () => {
    const result = service.signIn(username, password);

    httpMock
      .expectOne(TOKEN_URL)
      .flush('', { status: 500, statusText: 'Server Error' });

    await expect(result).rejects.toThrow('Sign-in failed');
  });

  it('should remove the token on sign out', () => {
    const removeToken = jest.spyOn(authService, 'removeToken');

    service.signOut();

    expect(removeToken).toHaveBeenCalled();
  });
});
