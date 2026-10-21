import { Component, isDevMode } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { StellarOverlayComponent } from '@hypertheory-labs/stellar-ng-devtools';
import { MockPanel } from 'mock-control';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MockPanel, StellarOverlayComponent],
  selector: 'app-root',
  styles: [],
  template: `
    <header class="navbar bg-base-200 px-4">
      <a routerLink="/" class="text-xl font-semibold mr-6">Library (Reference)</a>
      <ul class="menu menu-horizontal">
        <li><a routerLink="card" routerLinkActive="menu-active">Card</a></li>
        <li><a routerLink="/titles/before" routerLinkActive="menu-active">Titles (before)</a></li>
        <li><a routerLink="/titles/after" routerLinkActive="menu-active">Titles (after)</a></li>
        <li>
          <a routerLink="/holds/before/1002" routerLinkActive="menu-active"
            >Place a hold (before)</a
          >
        </li>
        <li>
          <a routerLink="/holds/after/1002" routerLinkActive="menu-active">Place a hold (after)</a>
        </li>
        <li>
          <a routerLink="/holds/outbox/1002" routerLinkActive="menu-active"
            >Place a hold (outbox)</a
          >
        </li>
        <li><a routerLink="/cancel/before" routerLinkActive="menu-active">Cancel (before)</a></li>
        <li><a routerLink="/cancel/after" routerLinkActive="menu-active">Cancel (after)</a></li>
        <li>
          <a routerLink="/shelf/before/1003" routerLinkActive="menu-active">Shelf (before)</a>
        </li>
        <li><a routerLink="/shelf/after/1003" routerLinkActive="menu-active">Shelf (after)</a></li>
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
      <stellar-overlay />
    }
  `,
})
export class App {
  protected readonly isDev = isDevMode();
}
