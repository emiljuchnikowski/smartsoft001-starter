import { expect, Page, test } from 'playwright/test';

import {
  createNote,
  endButton,
  noteRow,
  signInFast,
  uniqueTitle,
  visit,
} from './support/app';

/**
 * Every test starts from a note of its own and opens it from the list, so
 * none depends on the state another test left behind. Each test runs in a
 * fresh browser context, and in the demo the notes live in that context.
 */
test.describe('note item page', () => {
  test.beforeEach(async ({ page }) => {
    await signInFast(page);
  });

  /** Creates a note with that title and opens its item page from the list. */
  async function openNote(page: Page, title: string): Promise<void> {
    await createNote(page, title);
    await visit(page, '/notes');

    await noteRow(page, title).getByRole('button', { name: '→' }).click();

    await page.waitForURL(/\/notes\/[^/]+$/);
  }

  /** Switches the item page to the edit form and saves a new title. */
  async function saveTitle(page: Page, changedTitle: string): Promise<void> {
    await endButton(page, 'edit').click();
    await page
      .locator('smart-input-text input[type="text"]')
      .fill(changedTitle);
    await endButton(page, 'save').click();
  }

  test('opens the details of a note from the list', async ({ page }) => {
    const title = uniqueTitle('Item note');

    await openNote(page, title);

    await expect(page.getByRole('heading', { level: 2 })).toContainText(title);
    await expect(page.locator('smart-detail-text p').first()).toHaveText(title);
  });

  test('switches to the edit form with the current title filled in', async ({
    page,
  }) => {
    const title = uniqueTitle('Edited note');
    await openNote(page, title);

    await endButton(page, 'edit').click();

    await expect(
      page.locator('smart-input-text input[type="text"]'),
    ).toHaveValue(title);
    await expect(endButton(page, 'save')).toBeVisible();
  });

  test('saves a new title from the edit form', async ({ page }) => {
    const title = uniqueTitle('Saved note');
    const changedTitle = `${title} changed`;
    await openNote(page, title);

    await saveTitle(page, changedTitle);

    await expect(page.getByRole('heading', { level: 2 })).toContainText(
      changedTitle,
    );
  });

  test('still shows the new title after a reload', async ({ page }) => {
    const title = uniqueTitle('Reloaded note');
    const changedTitle = `${title} changed`;
    await openNote(page, title);
    await saveTitle(page, changedTitle);
    await expect(page.getByRole('heading', { level: 2 })).toContainText(
      changedTitle,
    );

    await page.reload();

    // Nothing is cached across the reload, so the title can only come back
    // from the API, or from the double's storage in the demo.
    await expect(page.getByRole('heading', { level: 2 })).toContainText(
      changedTitle,
    );
    await expect(page.locator('smart-detail-text p').first()).toHaveText(
      changedTitle,
    );
  });
});
