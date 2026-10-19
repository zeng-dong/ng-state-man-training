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
    path: 'snapshots',
    loadChildren: () => import('../app/areas/snapshots/routes').then((r) => r.snapshotsRoutes),
    title: 'Snapshots',
  },
];
