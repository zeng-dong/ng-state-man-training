import { Routes } from '@angular/router';

/*
  before/: the version students start with (ships to them).
  after/:  the solution. Delete the folder and its route before class.
*/
export const titlesRoutes: Routes = [
  { path: '', redirectTo: 'before', pathMatch: 'full' },
  { path: 'before', loadChildren: () => import('./before/routes').then((m) => m.beforeRoutes) },
  { path: 'after', loadChildren: () => import('./after/routes').then((m) => m.afterRoutes) },
];
