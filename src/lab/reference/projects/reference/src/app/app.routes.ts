import { Routes } from '@angular/router';
import { CardHome } from './areas/card/home';

export const routes: Routes = [
  { path: '', redirectTo: 'titles', pathMatch: 'full' },
  { path: 'card', component: CardHome },
  {
    path: 'titles',
    loadChildren: () => import('./areas/titles/routes').then((m) => m.titlesRoutes),
  },
  {
    path: 'holds',
    loadChildren: () => import('./areas/holds/routes').then((m) => m.holdsRoutes),
  },
  {
    path: 'cancel',
    loadChildren: () => import('./areas/cancel/routes').then((m) => m.cancelRoutes),
  },
  {
    path: 'shelf',
    loadChildren: () => import('./areas/shelf/routes').then((m) => m.shelfRoutes),
  },
];
