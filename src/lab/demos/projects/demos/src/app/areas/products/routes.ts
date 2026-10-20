import { Home } from './home';
import { nonBlocking, type Routes } from '@angular/router';
import { Index } from './pages';
import { Details } from './pages/details';
import { httpResource } from '@angular/common/http';
import { ProductModel } from './types';
import { Todos } from './pages/todos';

export const productsRoutes: Routes = [
  {
    path: '',
    component: Home,
    children: [
      {
        path: 'todos',
        component: Todos,
      },
      {
        path: '', // shows the list
        component: Index,
        resources: () => {
          return { list: nonBlocking(httpResource<ProductModel[]>(() => '/api/products')) };
        },
        children: [
          {
            path: ':id',
            component: Details,
            resources: (ctx) => ({
              product: nonBlocking(httpResource(() => `/api/products/${ctx.params()['id']}`)),
            }),
          },
        ],
      },
    ],
  },
];
