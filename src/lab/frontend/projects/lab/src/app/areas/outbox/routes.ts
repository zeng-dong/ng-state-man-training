import { Routes } from '@angular/router';

export const outboxRoutes: Routes = [
  {
    path: 'before/:titleId',
    loadComponent: () => import('./before/place-hold').then((m) => m.PlaceHold),
  },
  // { path: 'after/:titleId', loadComponent: () => import('./after/place-hold').then((m) => m.PlaceHold) },
];
