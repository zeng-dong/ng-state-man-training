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
  ),

  // the real branches (Lab 2's pickup list); the panel can slow or empty them
  configurable(
    {
      id: 'api.branches',
      label: 'Branches (real API)',
      method: 'GET',
      path: `${api}/branches`,
      returnsArray: true,
    },
    () => passthrough(),
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

  // the write, too: the panel can slow or fail it before it reaches the API (Lab 3)
  configurable(
    {
      id: 'api.holds.place',
      label: 'Place hold (real API)',
      method: 'PUT',
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
