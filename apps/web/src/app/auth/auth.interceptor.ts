import {
  HTTP_INTERCEPTORS,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject, Injectable, Provider } from '@angular/core';
import { Observable } from 'rxjs';

import { AUTH_TOKEN, StorageService } from '@smartsoft001/angular';

/** Returns the request with the stored bearer token, or unchanged without one. */
function withBearer<T>(
  request: HttpRequest<T>,
  storage: StorageService,
): HttpRequest<T> {
  const token: { access_token: string } | null = storage.getItem(AUTH_TOKEN);

  if (!token?.access_token) return request;

  return request.clone({
    setHeaders: { Authorization: `Bearer ${token.access_token}` },
  });
}

/** Adds the stored bearer token to every outgoing request. */
export const authInterceptor: HttpInterceptorFn = (request, next) =>
  next(withBearer(request, inject(StorageService)));

/**
 * The same interceptor as a DI provider, which is the registration the app
 * uses. `CrudModule.forFeature` imports `SharedModule`, and `SharedModule`
 * re-exports `HttpClientModule`, so the lazily loaded notes route builds its
 * own `HttpClient`. Functional interceptors registered at the root are not
 * seen by that client, a class registered under `HTTP_INTERCEPTORS` at the
 * root still is.
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private storage = inject(StorageService);

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    return next.handle(withBearer(request, this.storage));
  }
}

export const AUTH_INTERCEPTOR_PROVIDER: Provider = {
  provide: HTTP_INTERCEPTORS,
  useClass: AuthInterceptor,
  multi: true,
};
