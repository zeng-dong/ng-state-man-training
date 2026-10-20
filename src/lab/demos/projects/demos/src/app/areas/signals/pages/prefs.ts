import { Component, inject } from '@angular/core';
import { SomeSharedService } from '../../shared/some-service';
import { CounterStore } from '../stores/counter';

@Component({
  selector: 'app-signals-prefs',
  providers: [SomeSharedService],
  imports: [],
  template: `
    <div class="join">
      @for (b of store.byValues(); track b) {
        <button
          [aria-disabled]="store.countBy() === b"
          (click)="store.setCountBy(b)"
          class="btn join-item"
        >
          {{ b }}
        </button>
      }
    </div>
  `,
  styles: ``,
})
export class Prefs {
  private readonly store = inject(CounterStore);
}
