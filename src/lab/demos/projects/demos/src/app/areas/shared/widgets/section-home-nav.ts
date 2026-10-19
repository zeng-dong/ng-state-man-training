import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-shared-section-home-nav',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <ul class="menu menu-horizontal bg-base-200">
      @for (link of links(); track link.path) {
        <li>
          <!-- query params are page-level state, so they carry across the section's tabs -->
          <a [routerLink]="link.path" queryParamsHandling="merge" routerLinkActive="menu-active">{{
            link.title
          }}</a>
        </li>
      }
    </ul>
    <section>
      <router-outlet />
    </section>
  `,
  styles: ``,
})
export class SectionHomeNav {
  links = input<{ title: string; path: string }[]>([]);
}
