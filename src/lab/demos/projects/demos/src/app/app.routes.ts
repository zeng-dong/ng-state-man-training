import { Routes } from '@angular/router';
import { Home } from './pages/home';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    title: 'ASM Home',
  },
  {
    path: 'signals',
    loadChildren: () => import('../app/areas/signals/routes').then((r) => r.routes),
  },
  {
    path: 'products',
    loadChildren: () => import('../app/areas/products/routes').then((r) => r.productsRoutes),
  },
  {
    path: 'snapshots',
    loadChildren: () => import('../app/areas/snapshots/routes').then((r) => r.snapshotsRoutes),
    title: 'Snapshots',
  },
];
