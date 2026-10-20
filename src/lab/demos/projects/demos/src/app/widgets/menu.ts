import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-menu-widget',
  imports: [RouterLink, RouterLinkActive],
  template: ` <ul class="menu  bg-base-200 rounded-box lg:min-w-max">
    <li>
      <h2 class="menu-title">Outside Data</h2>
      <ul>
        <li><a routerLink="snapshots" routerLinkActive="bg-base-100">Snapshots</a></li>
      </ul>
    </li>
    <li>
      <h2 class="menu-title">Signals</h2>
      <ul>
        <li>
          <a routerLink="signals" routerLinkActive="bg-base-100">Counter</a>
        </li>
        <li>
          <a routerLink="signals/prefs" routerLinkActive="bg-base-100">Prefs</a>
        </li>
      </ul>
    </li>
    <li>
      <h2 class="menu-title">Products</h2>
      <ul>
        <li>
          <a routerLink="products" routerLinkActive="bg-base-100">List</a>
        </li>
      </ul>
    </li>
  </ul>`,
  styles: ``,
})
export class Menu {}
