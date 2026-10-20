import { Routes } from '@angular/router';
import { Home } from './home';
import { Signals101 } from './pages/signals-101';
import { With } from './pages/with';
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
        path: 'with',
        component: With,
      },
      {
        path: 'signals',
        component: Signals101,
      },
      {
        path: 'without',
        loadComponent: () => import('./pages/without').then((m) => m.Without),
      },
    ],
  },
];
