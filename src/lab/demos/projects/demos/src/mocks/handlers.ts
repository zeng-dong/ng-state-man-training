import { HttpResponse } from 'msw';
import { configurable } from 'mock-control';
import {
  findProduct,
  largeProducts,
  malformedProduct,
  malformedProducts,
  Product,
  products,
} from './data/products';

export const handlers = [
  configurable(
    {
      id: 'error-logger',
      label: 'Error Logging Api',
      method: 'POST',
      path: 'https://logging.hypertheory-labs.dev/errors',
    },
    ({ request }) => HttpResponse.json({ trackingNumber: 42069 }),
  ),
  configurable(
    {
      id: 'todos-list',
      label: 'Some Todos',
      method: 'GET',
      path: 'https://jsonplaceholder.typicode.com/todos',
      returnsArray: true,
    },
    ({ request }) =>
      HttpResponse.json([
        {
          userId: '99',
          id: 'tacos',
          completed: false,
        },
      ]),
  ),
  configurable(
    {
      id: 'products.list',
      label: 'Product list',
      method: 'GET',
      path: '/api/products',
      returnsArray: true,
    },
    ({ request }) => paged(request, products.map(summary)),
    {
      large: {
        label: 'Large (500 items)',
        resolve: ({ request }) => paged(request, largeProducts.map(summary)),
      },
      largeMaxPrice: {
        label: 'Large (500 items), filterable by ?max-price',
        resolve: ({ request }) => paged(request, byMaxPrice(request, largeProducts).map(summary)),
      },
      malformed: {
        label: 'Malformed data',
        resolve: () => HttpResponse.json(malformedProducts),
      },
      html: {
        label: 'HTML instead of JSON (200)',
        resolve: () => htmlLoginPage(),
      },
    },
  ),

  configurable(
    { id: 'products.detail', label: 'Product detail', method: 'GET', path: '/api/products/:id' },
    ({ params }) => {
      const product = findProduct(params['id']);
      return product ? HttpResponse.json(product) : new HttpResponse(null, { status: 404 });
    },
    {
      malformed: {
        label: 'Malformed data',
        resolve: ({ params }) => HttpResponse.json({ ...malformedProduct, id: params['id'] }),
      },
      html: {
        label: 'HTML instead of JSON (200)',
        resolve: () => htmlLoginPage(),
      },
    },
  ),

  configurable(
    { id: 'products.update', label: 'Update product', method: 'PUT', path: '/api/products/:id' },
    async ({ params, request }) => {
      const index = products.findIndex((p) => p.id === params['id']);
      if (index === -1) return new HttpResponse(null, { status: 404 });
      const changes = (await request.json()) as Partial<Product>;
      products[index] = { ...products[index], ...changes, id: products[index].id };
      return HttpResponse.json(products[index]);
    },
  ),
];

function summary({ id, name, price }: Product) {
  return { id, name, price };
}

/**
 * Optional price filter: `?max-price=100` keeps products priced at or below 100.
 * A missing or non-numeric value leaves the list unfiltered.
 */
function byMaxPrice(request: Request, items: Product[]) {
  const raw = new URL(request.url).searchParams.get('max-price');
  const max = raw === null || raw.trim() === '' ? NaN : Number(raw);
  return Number.isNaN(max) ? items : items.filter((p) => p.price <= max);
}

/**
 * Optional server-side paging: `?page=2&pageSize=20`. Without `page`, returns everything.
 * The total is always sent in an `X-Total-Count` header.
 */
function paged<T>(request: Request, items: T[]) {
  const params = new URL(request.url).searchParams;
  const page = Number(params.get('page'));
  const pageSize = Number(params.get('pageSize')) || 20;
  const headers = { 'X-Total-Count': String(items.length) };
  if (!page) return HttpResponse.json(items, { headers });
  return HttpResponse.json(items.slice((page - 1) * pageSize, page * pageSize), { headers });
}

/** What you get when an expired session redirects an API call to a login page. */
function htmlLoginPage() {
  return HttpResponse.html('<!doctype html><html><body><h1>Please sign in</h1></body></html>');
}
