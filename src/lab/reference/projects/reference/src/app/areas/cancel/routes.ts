import { Routes } from '@angular/router';

/*
  Cancelling holds: State Top 10 #10, "apologies that overwrite."
  before/: ported from the old outbox demo's optimistic store (remove at once; on failure,
           reload everything). after/: each cancel kept beside the memory.
*/
export const cancelRoutes: Routes = [
  {
    path: 'before',
    loadComponent: () => import('./before/my-holds').then((m) => m.MyHolds),
  },
  {
    path: 'after',
    loadComponent: () => import('./after/my-holds').then((m) => m.MyHolds),
  },
];
