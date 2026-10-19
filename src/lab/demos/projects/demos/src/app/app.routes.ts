import { Routes } from '@angular/router';
import { Home } from './pages/home';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    title: 'ASM Home',
  },
  {
    path: 'snapshots',
    loadChildren: () => import('../app/areas/snapshots/routes').then((r) => r.snapshotsRoutes),
    title: 'Snapshots',
  },
];
