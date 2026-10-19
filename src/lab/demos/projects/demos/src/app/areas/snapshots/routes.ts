import { Routes } from '@angular/router';
import { Home } from './home';
export const snapshotsRoutes: Routes = [
  {
    path: '',
    component: Home,
    children: [
      {
        path: '',
        redirectTo: 'without',
        pathMatch: 'full',
      },
      {
        path: 'without',
        loadComponent: () => import('./pages/without').then((m) => m.Without),
      },
    ],
  },
];
