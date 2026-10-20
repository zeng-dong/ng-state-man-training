import { Home } from './home';
import type { Routes } from '@angular/router';
import { Index } from './pages';

export const productsRoutes: Routes = [
  {
    path: '',
    component: Home,
    children: [
      {
        path: '',
        component: Index,
      },
    ],
  },
];
