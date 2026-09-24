import { expect, test } from 'playwright/test';

import { accessToken, API_URL, demo } from './support/app';

/**
 * The API on its own: the model's `create: { required: true }` on `title` is
 * enforced by `CrudService` against the configured model type, and the
 * framework's `AppExceptionFilter` maps that `DomainValidationError` to 400.
 */
test.describe('notes API', () => {
  test.skip(demo, 'the hosted demo has no API to call directly');

  test('rejects a note without a title with 400', async ({ request }) => {
    const token = await accessToken(request);

    const response = await request.post(`${API_URL}/notes`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { content: '<p>no title</p>' },
    });

    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({
      details: expect.stringContaining('title'),
    });
  });

  test('rejects an anonymous read with 403', async ({ request }) => {
    const response = await request.get(`${API_URL}/notes`);

    expect(response.status()).toBe(403);
  });
});
