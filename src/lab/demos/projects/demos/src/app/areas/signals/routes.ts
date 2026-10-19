import { Routes } from '@angular/router';
import { Home } from './home';
import { Index } from './pages';

export const routes: Routes = [
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
