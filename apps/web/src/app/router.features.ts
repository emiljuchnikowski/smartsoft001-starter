import { RouterFeatures, withInMemoryScrolling } from '@angular/router';

/**
 * The router features of the development and production builds. The `demo`
 * build replaces this file with `router.features.demo.ts`.
 */
export const ROUTER_FEATURES: RouterFeatures[] = [
  withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
];
