import { httpResource } from '@angular/common/http';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { apiUrls, toTitles } from './api';

/** The title list stays mounted while you move between titles. */
@Component({
  selector: 'app-titles-after-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="flex gap-6">
      <nav aria-label="Titles">
        <ul class="menu bg-base-200 rounded-box w-64">
          @for (title of titles.value(); track title.id) {
            <li>
              <a [routerLink]="[title.id]" routerLinkActive="menu-active">{{ title.name }}</a>
            </li>
          } @empty {
            @if (titles.error()) {
              <li class="p-2">The catalog isn't answering right now.</li>
            } @else {
              <li class="skeleton h-48"></li>
            }
          }
        </ul>
      </nav>
      <div class="flex-1">
        <router-outlet />
      </div>
    </div>
  `,
})
export class Shell {
  protected readonly titles = httpResource(() => `${apiUrls.catalog}/titles`, {
    parse: toTitles,
    defaultValue: [],
  });
}
