import {
  RouterFeatures,
  withHashLocation,
  withInMemoryScrolling,
} from '@angular/router';

/**
 * The `demo` build's replacement of `router.features.ts`. GitHub Pages serves
 * files only and its 404 page belongs to the documentation, so a deep link
 * like /demo/notes/add has nothing to fall back to; with the route in the
 * hash, every address of the demo is /demo/index.html.
 */
export const ROUTER_FEATURES: RouterFeatures[] = [
  withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
  withHashLocation(),
];
