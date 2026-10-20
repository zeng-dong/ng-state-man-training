import { Routes } from '@angular/router';
import { Home } from './home';
import { Index } from './pages';
import { Prefs } from './pages/prefs';
import { CounterStore } from './stores/counter';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    providers: [CounterStore],
    children: [
      {
        path: '',
        component: Index,
      },
      {
        path: 'prefs',
        component: Prefs,
      },
    ],
  },
];
