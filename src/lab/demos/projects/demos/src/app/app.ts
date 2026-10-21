import { Component, inject, isDevMode } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { MockPanel } from 'mock-control';
import { Menu } from './widgets/menu';
import { ErrorStore } from './areas/shared/error-handling/store';
import { JsonPipe } from '@angular/common';
import { injectDispatch } from '@ngrx/signals/events';
import { httpErrorEvents } from './areas/shared/error-handling/events';
import { StellarOverlayComponent } from '@hypertheory-labs/stellar-ng-devtools';

@Component({
  imports: [RouterOutlet, Menu, MockPanel, StellarOverlayComponent],
  selector: 'app-root',
  styles: [],
  template: `
    <div class="drawer lg:drawer-open w-full">
      <input id="my-drawer-3" type="checkbox" class="drawer-toggle" />
      <div class="drawer-content flex flex-col items-start w-full">
        <!-- Page content here -->

        <div class="w-full h-12 bg-base-200 p-2">{{ r.getTitle() }}</div>
        <main class="p-2">
          @for (err of errorStore.entities(); track err.id) {
            <div class="toast toast-top">
              <div class="alert alert-info">
                <span>{{ err.message }}</span>
                <button (click)="events.errorDismissed(err.id)" class="btn btn-sm">Ok</button>
              </div>
            </div>
          }
          <router-outlet />
          <stellar-overlay />
        </main>

        <label for="my-drawer-3" class="btn drawer-button lg:hidden"> Open drawer </label>
      </div>
      <div class="drawer-side">
        <label for="my-drawer-3" aria-label="close sidebar" class="drawer-overlay"></label>
        <ul class="menu bg-base-200 min-h-full w-80 p-4">
          <app-menu-widget />
        </ul>
      </div>
    </div>

    @if (isDev) {
      <!-- lazy chunk; never loaded in production builds -->
      @defer (on idle) {
        <app-mock-panel />
      }
    }
  `,
})
export class App {
  private readonly r = inject(Title);
  protected readonly isDev = isDevMode();
  private readonly errorStore = inject(ErrorStore);
  private readonly events = injectDispatch(httpErrorEvents);
}
