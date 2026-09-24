const nxPreset = require('@nx/jest/preset').default;
const path = require('path');

const nm = path.join(__dirname, 'node_modules');

module.exports = {
  ...nxPreset,
  testEnvironmentOptions: {
    customExportConditions: ['node', 'require', 'default'],
  },
  moduleNameMapper: {
    ...nxPreset.moduleNameMapper,
    '^@angular/core/testing$': path.join(
      nm,
      '@angular/core/fesm2022/testing.mjs',
    ),
    '^@angular/core/rxjs-interop$': path.join(
      nm,
      '@angular/core/fesm2022/rxjs-interop.mjs',
    ),
    '^@angular/common/http$': path.join(
      nm,
      '@angular/common/fesm2022/http.mjs',
    ),
    '^@angular/common/http/testing$': path.join(
      nm,
      '@angular/common/fesm2022/http-testing.mjs',
    ),
    '^@angular/platform-browser/testing$': path.join(
      nm,
      '@angular/platform-browser/fesm2022/testing.mjs',
    ),
    '^@angular/platform-browser-dynamic/testing$': path.join(
      nm,
      '@angular/platform-browser-dynamic/fesm2022/testing.mjs',
    ),
    '^@angular/router/testing$': path.join(
      nm,
      '@angular/router/fesm2022/testing.mjs',
    ),
    '^@angular/cdk/(.*)$': path.join(nm, '@angular/cdk/fesm2022/$1.mjs'),
    '^@ngrx/store/testing$': path.join(nm, '@ngrx/store/fesm2022/testing.mjs'),
  },
};
