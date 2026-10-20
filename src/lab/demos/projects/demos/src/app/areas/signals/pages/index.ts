import { Component, computed, effect, inject, linkedSignal, signal } from '@angular/core';
import { Collapse } from '../../shared/widgets/collapse';

import { Even } from '../widgets/even';
import { CounterStore } from '../stores/counter';
import { SomeSharedService } from '../../shared/some-service';

@Component({
  selector: 'app-signals-pages-index',
  imports: [Collapse, Even],
  providers: [],
  template: `
    <app-shared-collapse title="Signals Stuff">
      <p>
        <b>Signals</b> own some value, provide an immutable reference, and have methods to set them
        and update them.
      </p>
      <p><b>Computed</b> values are produced by one or more signals and a computation</p>
      <p><b>Linked Signal</b> Creates in essence a writeable computed</p>
      <p><b>Effect</b> returns void, does something based on a predicate on a signal or signals.</p>
      <p><b>Debounced Signals</b>May wait until the snapshot demo...</p>
    </app-shared-collapse>
    <div class="m-4">
      <button (click)="store.decrement()" class="btn btn-sm btn-circle btn-error">-</button
      ><span class="font-mono text-3xl p-4 font-black">{{ store.current() }}</span>

      <button (click)="store.increment()" class="btn btn-sm btn-circle btn-success">+</button>
    </div>

    <app-signals-is-even />
  `,
  styles: ``,
})
export class Index {
  // inject - don't use constructor injection any more. it is deprecated.
  // use the inject function.
  private readonly store = inject(CounterStore);
  private readonly svc = inject(SomeSharedService);
}
