import { Component, isDevMode } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MockPanel } from 'mock-control';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MockPanel],
  selector: 'app-root',
  styles: [],
  template: `
    <header class="navbar bg-base-200 px-4">
      <a routerLink="/" class="text-xl font-semibold mr-6">Library</a>
      <ul class="menu menu-horizontal">
        <li><a routerLink="/titles/before" routerLinkActive="menu-active">Titles (before)</a></li>
        <li>
          <a routerLink="/holds/before/1001" routerLinkActive="menu-active"
            >Place a hold (before)</a
          >
        </li>
        <li>
          <a routerLink="/outbox/before/1001" routerLinkActive="menu-active">Outbox lab</a>
        </li>
      </ul>
    </header>
    <main class="p-4">
      <router-outlet />
    </main>

    @if (isDev) {
      <!-- lazy chunk; never loaded in production builds -->
      @defer (on idle) {
        <app-mock-panel />
      }
    }
  `,
})
export class App {
  protected readonly isDev = isDevMode();
}
