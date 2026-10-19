import { Routes } from '@angular/router';

export const titlesRoutes: Routes = [
  { path: '', redirectTo: 'before', pathMatch: 'full' },
  { path: 'before', loadChildren: () => import('./before/routes').then((m) => m.beforeRoutes) },
  // { path: 'after', loadChildren: () => import('./after/routes').then((m) => m.afterRoutes) },
];
