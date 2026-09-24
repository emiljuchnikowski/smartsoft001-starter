import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  RouterStateSnapshot,
} from '@angular/router';

import { AuthService } from '@smartsoft001/angular';

import { authGuard } from './auth.guard';

describe('authGuard', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/notes' } as RouterStateSnapshot;

  const configureWith = (authenticated: boolean) => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { isAuthenticated: () => authenticated },
        },
      ],
    });
  };

  it('should allow the navigation when the user is authenticated', () => {
    configureWith(true);

    const result = TestBed.runInInjectionContext(() => authGuard(route, state));

    expect(result).toBe(true);
  });

  it('should redirect to the login page when the user is not authenticated', () => {
    configureWith(false);

    const result = TestBed.runInInjectionContext(() => authGuard(route, state));

    expect(result?.toString()).toBe('/login');
  });
});
