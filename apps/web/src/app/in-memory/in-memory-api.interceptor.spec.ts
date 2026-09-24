import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { jwtDecode } from 'jwt-decode';
import { firstValueFrom } from 'rxjs';

import { Note } from '@app/model';

import {
  DEMO_CREDENTIALS,
  DEMO_NOTES_KEY,
  IN_MEMORY_API_PROVIDER,
} from './in-memory-api.interceptor';
import { AUTH_CLIENT_ID, TOKEN_URL } from '../auth/login.service';
import { notesConfig } from '../notes/notes.config';

interface IList {
  data: Note[];
  totalCount: number;
  links: Record<string, string> | null;
}

/**
 * The double answers a real `HttpClient` built the way the app builds it,
 * from DI interceptors, so no request reaches the network and there is no
 * `HttpTestingController` to flush.
 */
describe('InMemoryApiInterceptor', () => {
  const notesUrl = notesConfig.apiUrl;
  const grant = {
    grant_type: 'password',
    ...DEMO_CREDENTIALS,
    client_id: AUTH_CLIENT_ID,
  };
  const authorized = { headers: { Authorization: 'Bearer any-token' } };

  let http: HttpClient;

  const status = async (request: Promise<unknown>): Promise<number> => {
    try {
      await request;
    } catch (error) {
      return (error as HttpErrorResponse).status;
    }

    throw new Error('expected the request to fail');
  };

  const failure = async (
    request: Promise<unknown>,
  ): Promise<HttpErrorResponse> => {
    try {
      await request;
    } catch (error) {
      return error as HttpErrorResponse;
    }

    throw new Error('expected the request to fail');
  };

  const list = (query = ''): Promise<IList> =>
    firstValueFrom(http.get<IList>(`${notesUrl}${query}`, authorized));

  const create = (note: Partial<Note>): Promise<string> =>
    firstValueFrom(http.post<{ id: string }>(notesUrl, note, authorized)).then(
      (response) => response.id,
    );

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        IN_MEMORY_API_PROVIDER,
      ],
    });

    http = TestBed.inject(HttpClient);
  });

  afterEach(() => sessionStorage.clear());

  describe('POST /api/token', () => {
    it('should grant a token with the fields of the real API for the seeded credentials', async () => {
      const token = await firstValueFrom(
        http.post<Record<string, unknown>>(TOKEN_URL, grant),
      );

      expect(token).toEqual({
        access_token: expect.any(String),
        refresh_token: expect.any(String),
        token_type: 'bearer',
        expired_in: 3600,
        username: DEMO_CREDENTIALS.username,
      });
    });

    it('should issue a JWT AuthService can decode, valid for an hour with the admin permission', async () => {
      const now = Math.floor(Date.now() / 1000);

      const { access_token } = await firstValueFrom(
        http.post<{ access_token: string }>(TOKEN_URL, grant),
      );

      const payload = jwtDecode<{
        exp: number;
        permissions: string[];
        username: string;
      }>(access_token);
      expect(access_token.split('.')).toHaveLength(3);
      expect(payload.permissions).toEqual(['admin']);
      expect(payload.username).toBe(DEMO_CREDENTIALS.username);
      expect(payload.exp).toBeGreaterThanOrEqual(now + 3600);
    });

    it('should reject a wrong password with the 400 and the message of the real API', async () => {
      const error = await failure(
        firstValueFrom(
          http.post(TOKEN_URL, { ...grant, password: 'not-the-password' }),
        ),
      );

      expect(error.status).toBe(400);
      expect(error.error).toEqual({ details: 'Invalid username or password' });
    });

    it('should answer on a later tick, like a request over the network', async () => {
      let answered = false;

      const request = firstValueFrom(http.post(TOKEN_URL, grant)).then(
        () => (answered = true),
      );

      expect(answered).toBe(false);
      await request;
      expect(answered).toBe(true);
    });
  });

  describe('without a bearer token', () => {
    it('should forbid a read with 403', async () => {
      expect(await status(firstValueFrom(http.get(notesUrl)))).toBe(403);
    });

    it('should refuse a write with 401', async () => {
      expect(
        await status(firstValueFrom(http.post(notesUrl, { title: 'x' }))),
      ).toBe(401);
    });
  });

  describe('GET /api/notes', () => {
    it('should list the seeded note in the shape of the real API', async () => {
      const result = await list();

      expect(result).toEqual({
        data: [expect.objectContaining({ id: expect.any(String) })],
        totalCount: 1,
        links: null,
      });
    });

    it('should search, sort, page and count what the query asks for', async () => {
      await create({ title: 'Banana' });
      await create({ title: 'Apple' });
      await create({ title: 'Cherry' });

      const searched = await list('?$search=NAN');
      const sorted = await list('?sort=-title');
      const paged = await list('?limit=2&offset=1&sort=title');

      expect(searched.data.map((note) => note.title)).toEqual(['Banana']);
      expect(sorted.data.map((note) => note.title)).toEqual([
        'Welcome to the demo',
        'Cherry',
        'Banana',
        'Apple',
      ]);
      expect(paged.data.map((note) => note.title)).toEqual([
        'Banana',
        'Cherry',
      ]);
      expect(paged.totalCount).toBe(4);
      expect(paged.links).toEqual({
        prev: expect.stringContaining('offset=0'),
        first: expect.stringContaining('offset=0'),
        next: expect.stringContaining('offset=2'),
        last: expect.stringContaining('offset=2'),
      });
    });
  });

  describe('POST /api/notes', () => {
    it('should reject a note without a title the way AppExceptionFilter does', async () => {
      const error = await failure(create({ content: '<p>no title</p>' }));

      expect(error.status).toBe(400);
      expect(error.error).toEqual({ details: 'Required fields: title' });
    });

    it('should create a note with a MongoDB-like id and a Location header', async () => {
      const response = await firstValueFrom(
        http.post<{ id: string }>(
          notesUrl,
          { title: 'Created' },
          { ...authorized, observe: 'response' },
        ),
      );

      const id = response.body?.id ?? '';
      expect(id).toMatch(/^[0-9a-f]{24}$/);
      expect(response.headers.get('Location')).toBe(`${notesUrl}/${id}`);
      expect((await list()).data).toContainEqual({ id, title: 'Created' });
    });
  });

  describe('/api/notes/:id', () => {
    it('should return the note by id and 404 for an unknown id', async () => {
      const id = await create({ title: 'By id', content: '<p>body</p>' });

      const note = await firstValueFrom(
        http.get<Note>(`${notesUrl}/${id}`, authorized),
      );
      const missing = await failure(
        firstValueFrom(
          http.get(`${notesUrl}/000000000000000000000abc`, authorized),
        ),
      );

      expect(note).toEqual({ id, title: 'By id', content: '<p>body</p>' });
      expect(missing.status).toBe(404);
      expect(missing.error).toEqual({ details: 'Invalid id' });
    });

    it('should replace the note on PUT and keep its id', async () => {
      const id = await create({ title: 'Before', content: '<p>old</p>' });

      await firstValueFrom(
        http.put(`${notesUrl}/${id}`, { id, title: 'After' }, authorized),
      );

      expect(
        await firstValueFrom(http.get<Note>(`${notesUrl}/${id}`, authorized)),
      ).toEqual({ id, title: 'After' });
    });

    it('should merge the fields on PATCH and validate the title', async () => {
      const id = await create({ title: 'Before', content: '<p>kept</p>' });

      await firstValueFrom(
        http.patch(`${notesUrl}/${id}`, { id, title: 'After' }, authorized),
      );
      const invalid = await failure(
        firstValueFrom(
          http.patch(`${notesUrl}/${id}`, { title: '' }, authorized),
        ),
      );

      expect(
        await firstValueFrom(http.get<Note>(`${notesUrl}/${id}`, authorized)),
      ).toEqual({ id, title: 'After', content: '<p>kept</p>' });
      expect(invalid.status).toBe(400);
    });

    it('should delete the note and answer 404 for a second delete', async () => {
      const id = await create({ title: 'Doomed' });

      await firstValueFrom(http.delete(`${notesUrl}/${id}`, authorized));

      expect((await list()).totalCount).toBe(1);
      expect(
        await status(
          firstValueFrom(http.delete(`${notesUrl}/${id}`, authorized)),
        ),
      ).toBe(404);
    });
  });

  describe('storage', () => {
    it('should keep the notes in sessionStorage so a reload of the demo shows them again', async () => {
      const id = await create({ title: 'Survives a reload' });

      const stored = JSON.parse(
        sessionStorage.getItem(DEMO_NOTES_KEY) ?? '[]',
      ) as Note[];

      expect(stored).toContainEqual({ id, title: 'Survives a reload' });
    });

    it('should start from what a previous instance stored', async () => {
      sessionStorage.setItem(
        DEMO_NOTES_KEY,
        JSON.stringify([{ id: '0000000000000000000000ab', title: 'Stored' }]),
      );
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(withInterceptorsFromDi()),
          IN_MEMORY_API_PROVIDER,
        ],
      });
      http = TestBed.inject(HttpClient);

      const result = await list();

      expect(result.data).toEqual([
        { id: '0000000000000000000000ab', title: 'Stored' },
      ]);
    });
  });
});
