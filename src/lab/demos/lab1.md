# Working with signal store and `httpResource`

This first lab is about working with _outside_ reference data, and adding some _inside_ preferences data for the user.

## Create the area

In the demos project, inside `src/app/areas` create a new directory called `products`.

Add the following directory and files to this `products` directory:

```
pages/
	index.ts
home.ts
routes.ts
```

In the `home.ts` create a landing component with a router outlet.

> Note: if you open the home.ts and type `ngc` you should be given the option to use a snippet. Hit the tab key, and tab through the placeholders to create the component. This is from a snippet in `.vscode/typescript.code-snippets`

<details>

<summary>`src/app/areas/products/home.ts`</summary>

```ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-products',
  imports: [RouterOutlet],
  template: ` <router-outlet /> `,
  styles: ``,
})
export class Home {}
```

</details>

Next create the `pages/index.ts`

<details>

<summary>`src/app/areas/products/pages/index.ts`</summary>

```ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-products-index',
  imports: [],
  template: ` <p>Products Index Page</p> `,
  styles: ``,
})
export class Index {}
```

</details>

Now we will create the area routes.

<details>

<summary>`src/app/areas/products/routes.ts`</summary>

```ts
import { Home } from './home';
import type { Routes } from '@angular/router';

export const productsRoutes: Routes = [
  {
    path: '',
    component: Home,
  },
];
```

</details>

Add a lazy loaded route to `app.routes.ts`

```ts diff
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
```

And lastly, for this step, add a link in our navigation component:

In `src/app/widgets/menu.ts`

```

```
