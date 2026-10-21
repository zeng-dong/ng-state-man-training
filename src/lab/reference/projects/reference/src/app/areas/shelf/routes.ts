import { Routes } from '@angular/router';

/*
  Is it on the shelf? State Top 10 #9, "caches that never forget."
  before/: a root service caching each title's copies with shareReplay(1), forever.
  after/:  a resource owned by the page, refreshed when the user comes back, with an "as of".
*/
export const shelfRoutes: Routes = [
  {
    path: 'before/:titleId',
    loadComponent: () => import('./before/on-the-shelf').then((m) => m.OnTheShelf),
  },
  {
    path: 'after/:titleId',
    loadComponent: () => import('./after/on-the-shelf').then((m) => m.OnTheShelf),
  },
];
