import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AuthService } from '@smartsoft001/angular';

import { AUTH_INTERCEPTOR_PROVIDER, authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  const accessToken = 'placeholder-access-token';

  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should add the bearer header when a token is stored', () => {
    authService.setToken({ access_token: accessToken });

    http.get('/api/notes').subscribe();

    const request = httpMock.expectOne('/api/notes');
    expect(request.request.headers.get('Authorization')).toBe(
      `Bearer ${accessToken}`,
    );

    request.flush([]);
  });

  it('should pass the request through when no token is stored', () => {
    http.get('/api/notes').subscribe();

    const request = httpMock.expectOne('/api/notes');
    expect(request.request.headers.has('Authorization')).toBe(false);

    request.flush([]);
  });
});

describe('AUTH_INTERCEPTOR_PROVIDER', () => {
  const accessToken = 'placeholder-access-token';

  afterEach(() => localStorage.clear());

  it('should add the bearer header through the DI interceptor registration', () => {
    // Arrange: the registration the app uses, with an HttpClient built from DI
    // interceptors, which is what SharedModule's HttpClientModule does too.
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        AUTH_INTERCEPTOR_PROVIDER,
        provideHttpClientTesting(),
      ],
    });
    TestBed.inject(AuthService).setToken({ access_token: accessToken });
    const httpMock = TestBed.inject(HttpTestingController);

    // Act
    TestBed.inject(HttpClient).get('/api/notes').subscribe();

    // Assert
    const request = httpMock.expectOne('/api/notes');
    expect(request.request.headers.get('Authorization')).toBe(
      `Bearer ${accessToken}`,
    );
    request.flush([]);
    httpMock.verify();
  });
});
