import { expect, test } from 'playwright/test';

import {
  createNote,
  createNoteThroughForm,
  endButton,
  noteRow,
  signInFast,
  uniqueTitle,
  visit,
} from './support/app';

test.describe('notes list', () => {
  test.beforeEach(async ({ page }) => {
    await signInFast(page);
    await visit(page, '/notes');
  });

  test('shows the page title and the add button', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();
    await expect(endButton(page, 'add')).toBeVisible();
  });

  test('shows a row for a note created through the add form', async ({
    page,
  }) => {
    const title = uniqueTitle('Form note');

    await createNoteThroughForm(page, title);

    await expect(
      noteRow(page, title).locator('td[smart-item-key="title"]'),
    ).toContainText(title);
  });

  test('removes a row after the confirm dialog is confirmed', async ({
    page,
  }) => {
    const title = uniqueTitle('Removable note');
    await createNote(page, title);
    await page.reload();
    const row = noteRow(page, title);

    await row.getByRole('button', { name: 'remove', exact: true }).click();

    // The row's remove button opens the framework's confirm dialog; nothing is
    // deleted until its confirm button is clicked.
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('confirm delete object');
    await expect(row).toBeVisible();

    await dialog.getByRole('button', { name: 'confirm', exact: true }).click();

    await expect(dialog).toHaveCount(0);
    await expect(row).toHaveCount(0);
  });

  test('keeps the row when the confirm dialog is cancelled', async ({
    page,
  }) => {
    const title = uniqueTitle('Kept note');
    await createNote(page, title);
    await page.reload();
    const row = noteRow(page, title);

    await row.getByRole('button', { name: 'remove', exact: true }).click();
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'cancel', exact: true })
      .click();

    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    await expect(row).toBeVisible();
  });
});
