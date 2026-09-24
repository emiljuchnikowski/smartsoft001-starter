import {
  HTTP_INTERCEPTORS,
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpHeaders,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Injectable, Provider } from '@angular/core';
import { Observable, of, throwError, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { Note } from '@app/model';

import { AUTH_CLIENT_ID, TOKEN_URL } from '../auth/login.service';
import { notesConfig } from '../notes/notes.config';

/**
 * A test double of the API for the hosted demo, where no server can run. It
 * answers the requests the frontend makes, with the status codes and bodies
 * the real API sends for them, and nothing else: no refresh grant, no bulk
 * create, no export. Anything it does not know is passed on to the network.
 *
 * The notes live in `sessionStorage`, so a reload of the demo shows the same
 * notes and a new tab starts from the seed again. The Playwright suite
 * reloads the page and expects the data to come back, the same way it would
 * come back from the database.
 */

/** The user the real API seeds, with the password from `.env.example`. */
export const DEMO_CREDENTIALS = {
  username: 'admin@example.com',
  password: 'change-me',
};

/** Lifetime of the issued token in seconds, the default of `JWT_EXPIRES_IN`. */
const TOKEN_LIFETIME = 3600;

/** Key the notes are kept under in `sessionStorage`. */
export const DEMO_NOTES_KEY = 'DEMO_NOTES';

/** The note every fresh demo starts with, so the list is not empty. */
const SEED: Note[] = [
  {
    id: '000000000000000000000001',
    title: 'Welcome to the demo',
    content:
      '<p>This note comes from an in-memory double of the API. Add, edit and remove notes; they stay in this browser tab only.</p>',
  },
];

interface IPasswordGrant {
  grant_type: string;
  username: string;
  password: string;
  client_id: string;
}

const NOTES_URL = notesConfig.apiUrl;

/** Base64url of a JSON value, the encoding of a JWT segment. The payload is ASCII. */
function base64url(value: unknown): string {
  return btoa(JSON.stringify(value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/** A 24 character hex id, the shape MongoDB gives the real notes. */
function newId(): string {
  const seconds = Math.floor(Date.now() / 1000).toString(16);
  const random = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join('');

  return (seconds + random).slice(0, 24);
}

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

@Injectable()
export class InMemoryApiInterceptor implements HttpInterceptor {
  private notes: Note[] = this.load();

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    return this.route(request) ?? next.handle(request);
  }

  private route(
    request: HttpRequest<unknown>,
  ): Observable<HttpEvent<unknown>> | null {
    // `urlWithParams` carries the query the CRUD service builds into the URL.
    const { pathname, searchParams } = new URL(
      request.urlWithParams,
      'http://in-memory',
    );

    if (request.method === 'POST' && pathname === TOKEN_URL) {
      return this.grantToken(request);
    }

    if (pathname === NOTES_URL || pathname.startsWith(NOTES_URL + '/')) {
      return this.notes$(request, pathname, searchParams);
    }

    return null;
  }

  private grantToken(
    request: HttpRequest<unknown>,
  ): Observable<HttpEvent<unknown>> {
    const grant = request.body as Partial<IPasswordGrant>;

    if (grant.grant_type !== 'password' || grant.client_id !== AUTH_CLIENT_ID) {
      return this.reply(request, 400, { details: 'Invalid grant' });
    }

    if (
      grant.username !== DEMO_CREDENTIALS.username ||
      grant.password !== DEMO_CREDENTIALS.password
    ) {
      return this.reply(request, 400, {
        details: 'Invalid username or password',
      });
    }

    const issuedAt = Math.floor(Date.now() / 1000);
    // A syntactically valid JWT: `AuthService` decodes the payload for `exp`
    // and `permissions` and never verifies the signature, so the third
    // segment is a placeholder.
    const accessToken = [
      base64url({ alg: 'HS256', typ: 'JWT' }),
      base64url({
        permissions: ['admin'],
        username: grant.username,
        sub: grant.username,
        iat: issuedAt,
        exp: issuedAt + TOKEN_LIFETIME,
      }),
      base64url('in-memory'),
    ].join('.');

    return this.reply(request, 200, {
      access_token: accessToken,
      refresh_token: newId(),
      token_type: 'bearer',
      expired_in: TOKEN_LIFETIME,
      username: grant.username,
    });
  }

  private notes$(
    request: HttpRequest<unknown>,
    pathname: string,
    params: URLSearchParams,
  ): Observable<HttpEvent<unknown>> {
    const id = pathname.slice(NOTES_URL.length + 1);
    const anonymous = !request.headers
      .get('Authorization')
      ?.startsWith('Bearer ');

    // The real API lets an anonymous read reach the permission check, which
    // forbids it, and stops an anonymous write at the JWT guard.
    if (anonymous) {
      return request.method === 'GET'
        ? this.reply(request, 403, { details: 'Context forbidden' })
        : this.reply(request, 401, { details: 'Unauthorized' });
    }

    // What NestJS answers for a route the controller does not declare.
    const unknownRoute = () =>
      this.reply(request, 404, {
        details: `Cannot ${request.method} ${pathname}`,
      });

    if (!id) {
      if (request.method === 'GET') return this.list(request, params);
      if (request.method === 'POST') return this.create(request);

      return unknownRoute();
    }

    const index = this.notes.findIndex((note) => note.id === id);

    if (index < 0) return this.reply(request, 404, { details: 'Invalid id' });

    switch (request.method) {
      case 'GET':
        return this.reply(request, 200, this.notes[index]);
      case 'PUT':
        return this.update(request, index, request.body as Partial<Note>);
      case 'PATCH':
        return this.update(request, index, {
          ...this.notes[index],
          ...(request.body as Partial<Note>),
        });
      case 'DELETE':
        this.notes.splice(index, 1);
        this.save();
        return this.reply(request, 200, null);
      default:
        return unknownRoute();
    }
  }

  private list(
    request: HttpRequest<unknown>,
    params: URLSearchParams,
  ): Observable<HttpEvent<unknown>> {
    let data = [...this.notes];

    const search = params.get('$search')?.toLowerCase();
    if (search) {
      data = data.filter((note) =>
        [note.title, note.content].some((value) =>
          value?.toLowerCase().includes(search),
        ),
      );
    }

    const sort = params.get('sort');
    if (sort) {
      const desc = sort.startsWith('-');
      const key = (desc ? sort.slice(1) : sort) as keyof Note;

      data.sort(
        (a, b) =>
          String(a[key] ?? '').localeCompare(String(b[key] ?? '')) *
          (desc ? -1 : 1),
      );
    }

    const totalCount = data.length;
    const limit = Number(params.get('limit')) || 0;
    const offset = Number(params.get('offset')) || 0;

    if (limit) data = data.slice(offset, offset + limit);

    return this.reply(request, 200, {
      data,
      totalCount,
      links: this.links(params, offset, limit, totalCount),
    });
  }

  /** The paging links of the real list response: `null` without a limit. */
  private links(
    params: URLSearchParams,
    offset: number,
    limit: number,
    totalCount: number,
  ): Record<string, string> | null {
    if (!limit) return null;

    const links: Record<string, string> = {};
    const page = (at: number) => {
      const query = new URLSearchParams(params);
      query.set('offset', String(at));
      return `${NOTES_URL}?${query}`;
    };
    const lastOffset = Math.max(Math.ceil(totalCount / limit) - 1, 0) * limit;

    if (offset > 0) {
      links['prev'] = page(Math.max(offset - limit, 0));
      links['first'] = page(0);
    }
    if (offset + limit < totalCount) {
      links['next'] = page(Math.min(offset + limit, lastOffset));
      links['last'] = page(lastOffset);
    }

    return links;
  }

  private create(
    request: HttpRequest<unknown>,
  ): Observable<HttpEvent<unknown>> {
    const body = request.body as Partial<Note>;

    if (!hasText(body.title)) {
      return this.reply(request, 400, { details: 'Required fields: title' });
    }

    const note: Note = { ...body, id: newId(), title: body.title };
    this.notes.push(note);
    this.save();

    return this.reply(
      request,
      200,
      { id: note.id },
      { Location: `${NOTES_URL}/${note.id}` },
    );
  }

  private update(
    request: HttpRequest<unknown>,
    index: number,
    body: Partial<Note>,
  ): Observable<HttpEvent<unknown>> {
    if (!hasText(body.title)) {
      return this.reply(request, 400, { details: 'Required fields: title' });
    }

    this.notes[index] = {
      ...body,
      id: this.notes[index].id,
      title: body.title,
    };
    this.save();

    return this.reply(request, 200, null);
  }

  /**
   * A response or an error, always delivered on a later tick: a double that
   * answered synchronously would hide bugs the real client cannot have.
   */
  private reply(
    request: HttpRequest<unknown>,
    status: number,
    body: unknown,
    headers: Record<string, string> = {},
  ): Observable<HttpEvent<unknown>> {
    const url = request.urlWithParams;

    return timer(0).pipe(
      mergeMap(() =>
        status < 400
          ? of(
              new HttpResponse({
                status,
                body,
                url,
                headers: new HttpHeaders(headers),
              }),
            )
          : throwError(
              () => new HttpErrorResponse({ status, error: body, url }),
            ),
      ),
    );
  }

  private load(): Note[] {
    try {
      const stored = sessionStorage.getItem(DEMO_NOTES_KEY);
      if (stored) return JSON.parse(stored) as Note[];
    } catch {
      // Storage that cannot be read, or that holds something else: start over.
    }

    return SEED.map((note) => ({ ...note }));
  }

  private save(): void {
    try {
      sessionStorage.setItem(DEMO_NOTES_KEY, JSON.stringify(this.notes));
    } catch {
      // Without storage the notes still live for as long as the page does.
    }
  }
}

export const IN_MEMORY_API_PROVIDER: Provider = {
  provide: HTTP_INTERCEPTORS,
  useClass: InMemoryApiInterceptor,
  multi: true,
};
