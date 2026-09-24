import { TestBed } from '@angular/core/testing';
import { Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import {
  IModelValidatorsProvider,
  MODEL_VALIDATORS_PROVIDER,
  NgrxStoreService,
} from '@smartsoft001/angular';

import { appConfig } from './app.config';

describe('web: appConfig', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: appConfig.providers });
  });

  it('should provide the validators provider the form factory requires', async () => {
    // Arrange
    const provider = TestBed.inject<IModelValidatorsProvider>(
      MODEL_VALIDATORS_PROVIDER,
    );
    const base = { validators: [Validators.required] };

    // Act
    const result = await provider.get({ key: 'title', instance: {}, base });

    // Assert: the validators implied by the model metadata pass through.
    expect(result).toBe(base);
  });

  it('should register the application translations', () => {
    const translate = TestBed.inject(TranslateService);

    expect(translate.getLangs()).toEqual(expect.arrayContaining(['eng', 'pl']));
  });

  it('should connect the NgRx store the CRUD reducers are added to', () => {
    const storeService = TestBed.inject(NgrxStoreService);

    expect(storeService).toBeDefined();
  });
});
