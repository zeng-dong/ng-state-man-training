import { Component } from '@angular/core';
import { RouterOutlet, RouterLinkWithHref } from '@angular/router';

@Component({
  selector: 'app-signals-home',
  imports: [RouterOutlet, RouterLinkWithHref],
  template: `
    <div class="flex flex-row gap-4">
      <a class="link" [routerLink]="['..', 'signals']">Count</a>
      <a class="link" routerLink="prefs">Prefs</a>
    </div>

    <router-outlet />
  `,
  styles: ``,
})
export class Home {}
