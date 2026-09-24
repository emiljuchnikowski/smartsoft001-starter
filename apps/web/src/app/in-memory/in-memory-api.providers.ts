import { Provider } from '@angular/core';

/**
 * Nothing: the application talks to the real API. The `demo` build replaces
 * this file with `in-memory-api.providers.demo.ts`, which registers the
 * in-memory double, so the double never ships in the development or the
 * production build.
 */
export const IN_MEMORY_API_PROVIDERS: Provider[] = [];
