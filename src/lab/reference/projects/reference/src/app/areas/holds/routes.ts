import { Routes } from '@angular/router';

/*
  before/: the version students start with (ships to them).
  after/:  the solution. Delete the folder and its route before class.
*/
export const holdsRoutes: Routes = [
  {
    path: 'before/:titleId',
    loadComponent: () => import('./before/place-hold').then((m) => m.PlaceHold),
  },
  {
    path: 'after/:titleId',
    loadComponent: () => import('./after/place-hold').then((m) => m.PlaceHold),
  },
  // Day 3 (demo only): the same page, through the outbox
  {
    path: 'outbox/:titleId',
    loadComponent: () => import('./outbox/place-hold').then((m) => m.PlaceHoldWithOutbox),
  },
];
