import { TranslateService, TranslationObject } from '@ngx-translate/core';

/**
 * Labels the generated screens look up: the page title from `notesConfig.title`
 * and `MODEL.<field>` for every decorated field of `Note`. The framework ships
 * its own strings (buttons, validation) under the same two language codes.
 */
export const APP_TRANSLATIONS: Record<string, TranslationObject> = {
  eng: {
    Notes: 'Notes',
    MODEL: { title: 'Title', content: 'Content' },
  },
  pl: {
    Notes: 'Notatki',
    MODEL: { title: 'Tytuł', content: 'Treść' },
  },
};

export function registerAppTranslations(translate: TranslateService): void {
  Object.entries(APP_TRANSLATIONS).forEach(([lang, data]) => {
    translate.setTranslation(lang, data, true);
  });
}
