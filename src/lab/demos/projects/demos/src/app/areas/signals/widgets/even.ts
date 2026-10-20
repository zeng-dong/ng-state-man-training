import { Component, computed, inject, input } from '@angular/core';
import { CounterStore } from '../stores/counter';

@Component({
  selector: 'app-signals-is-even',
  imports: [],
  template: ` <pre class="p-4 m-2">{{ store.isEven() }}</pre> `,
  styles: ``,
})
export class Even {
  private readonly store = inject(CounterStore);
}
