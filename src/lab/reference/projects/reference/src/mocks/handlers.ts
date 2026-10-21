import { HttpResponse, passthrough } from 'msw';
import { configurable } from 'mock-control';
import { branches } from './data/branches';
import { authors, titles } from './data/catalog';
import { copies, loans } from './data/circulation';
import { reviews } from './data/reviews';
import { origins } from './origins';

/*
  Flat, one-table-per-endpoint APIs across four systems. Building a "title page" from these takes
  several requests, one of them dependent (the author needs the title's AUTH_ID).
*/

const { catalog, circulation, reviews: reviewsOrigin } = origins;

/** The real API (src/Backend). Requests to it pass through unless a scenario says otherwise. */
const { api } = origins;

export const handlers = [
  // --- the real API: Day 1's first real request, and MSW as a seam in front of it ---
  configurable(
    {
      id: 'check-email',
      label: 'Check Email',
      method: 'GET',
      path: `/api/check`,
      returnsArray: false,
    },
    () => passthrough(),
    {
      isTaken: { label: 'Is Taken', resolve: () => HttpResponse.json({ available: false }) },
      isAvailable: { label: 'Is Available', resolve: () => HttpResponse.json({ available: true }) },
    },
  ),
  configurable(
    {
      id: 'api.branches',
      label: 'Branches (real API)',
      method: 'GET',
      path: `${api}/branches`,
      returnsArray: true,
    },
    () => passthrough(),
    {
      thousand: {
        label: '1,000 branches',
        resolve: () =>
          HttpResponse.json(
            Array.from({ length: 1000 }, (_, i) => ({
              id: `B${String(i + 1).padStart(4, '0')}`,
              name: `Branch ${i + 1}`,
              isOpen: i % 7 !== 0,
            })),
          ),
      },
    },
  ),

  // --- catalog ---
  configurable(
    {
      id: 'catalog.titles',
      label: 'Catalog: search titles',
      method: 'GET',
      path: `${catalog}/titles`,
      returnsArray: true,
    },
    // `?q=` matches the title only; the catalog can't search by author
    ({ request }) => {
      const q = param(request, 'q')?.toLowerCase();
      return HttpResponse.json(
        q ? titles.filter((t) => t.TITLE_NM.toLowerCase().includes(q)) : titles,
      );
    },
  ),

  configurable(
    {
      id: 'catalog.title',
      label: 'Catalog: title',
      method: 'GET',
      path: `${catalog}/titles/:titleId`,
    },
    ({ params }) => found(titles.find((t) => t.TITLE_ID === Number(params['titleId']))),
  ),

  configurable(
    {
      id: 'catalog.author',
      label: 'Catalog: author',
      method: 'GET',
      path: `${catalog}/authors/:authId`,
    },
    ({ params }) => found(authors.find((a) => a.AUTH_ID === Number(params['authId']))),
  ),

  // --- branches ---
  configurable(
    {
      id: 'branches.list',
      label: 'Branches',
      method: 'GET',
      path: `${origins.branches}/branches`,
      returnsArray: true,
    },
    () => HttpResponse.json(branches),
  ),

  // --- circulation ---
  configurable(
    {
      id: 'circulation.copies',
      label: 'Circulation: copies',
      method: 'GET',
      path: `${circulation}/copies`,
      returnsArray: true,
    },
    // like the table it wraps: no filter means every row
    ({ request }) => HttpResponse.json(where(request, copies, { titleId: 'TITLE_ID' })),
    {
      // The world moves on: flip this while a page shows "Available", and see who notices.
      checkedOut: {
        label: 'Everything available is now checked out',
        resolve: ({ request }) =>
          HttpResponse.json(
            where(request, copies, { titleId: 'TITLE_ID' }).map((c) =>
              c.STATUS_CD === 'A' ? { ...c, STATUS_CD: 'O', DUE_DT: '20261030' } : c,
            ),
          ),
      },
    },
  ),

  // holds are real; this entry only puts the mock panel in front of them (delay, fail)
  configurable(
    {
      id: 'api.holds',
      label: 'Holds (real API)',
      method: 'GET',
      path: `${api}/holds`,
      returnsArray: true,
    },
    () => passthrough(),
  ),

  // The write, too: slow the trip to the server (or fail it before it arrives) from the panel.
  // A delay here is a slow network on the way there, not a slow server.
  configurable(
    {
      id: 'api.holds.place',
      label: 'Place hold (real API)',
      method: 'PUT',
      path: `${api}/holds/:id`,
    },
    () => passthrough(),
  ),

  // Cancelling, too. Its "hold" delay lets you choose which cancel lands first.
  configurable(
    {
      id: 'api.holds.cancel',
      label: 'Cancel hold (real API)',
      method: 'DELETE',
      path: `${api}/holds/:id`,
    },
    () => passthrough(),
  ),

  configurable(
    {
      id: 'circulation.loans',
      label: 'Circulation: loans',
      method: 'GET',
      path: `${circulation}/loans`,
      returnsArray: true,
    },
    ({ request }) =>
      HttpResponse.json(where(request, loans, { titleId: 'TITLE_ID', patronId: 'PATRON_ID' })),
  ),

  // --- reviews (the newer service: an envelope instead of a bare array) ---
  configurable(
    {
      id: 'reviews.list',
      label: 'Reviews',
      method: 'GET',
      path: `${reviewsOrigin}/reviews`,
    },
    ({ request }) => {
      const titleId = param(request, 'titleId');
      const items = titleId ? reviews.filter((r) => r.titleId === titleId) : reviews;
      return HttpResponse.json({ items, total: items.length });
    },
  ),
];

function param(request: Request, name: string) {
  const value = new URL(request.url).searchParams.get(name)?.trim();
  return value ? value : undefined;
}

/** Filters rows by query params, e.g. `?titleId=1001` against the `TITLE_ID` column. */
function where<T>(request: Request, rows: T[], columns: Record<string, keyof T>) {
  return Object.entries(columns).reduce((result, [name, column]) => {
    const value = param(request, name);
    return value === undefined ? result : result.filter((row) => String(row[column]) === value);
  }, rows);
}

function found<T>(row: T | undefined) {
  return row ? HttpResponse.json(row) : new HttpResponse(null, { status: 404 });
}
