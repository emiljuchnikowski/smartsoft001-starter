import { expect, test } from 'playwright/test';

import { credentials, signIn, submitSignInForm, visit } from './support/app';

/** Deliberately not the seeded password, so the API rejects the grant. */
const INVALID_PASSWORD = 'not-the-seeded-password';

test.describe('login', () => {
  test('sends an anonymous visitor from /notes to the login page', async ({
    page,
  }) => {
    await visit(page, '/notes');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator('#smart-sign-in-form-email')).toBeVisible();
  });

  test('keeps a wrong password on the login page and shows the error', async ({
    page,
  }) => {
    await submitSignInForm(page, {
      ...credentials(),
      password: INVALID_PASSWORD,
    });

    await expect(page.locator('p[role="alert"]')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('takes the seeded user to the notes list', async ({ page }) => {
    await signIn(page);

    await expect(page).toHaveURL(/\/notes$/);
    await expect(page.locator('button.app-header__sign-out')).toBeVisible();
  });

  test('returns to the login page after signing out', async ({ page }) => {
    await signIn(page);

    await page.locator('button.app-header__sign-out').click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator('button.app-header__sign-out')).toHaveCount(0);
  });
});
