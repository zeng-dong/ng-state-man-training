import { Component, signal } from '@angular/core';
import { Collapse } from '../../shared/widgets/collapse';

@Component({
  selector: 'app-signals-pages-index',
  imports: [Collapse],
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
      <button (click)="current.update((c) => c - 1)" class="btn btn-sm btn-circle btn-error">
        -</button
      ><span class="font-mono text-2xl p-4 font-black">{{ current() }}</span
      ><button (click)="current.update((c) => c + 1)" class="btn btn-sm btn-circle btn-success">
        +
      </button>
    </div>
  `,
  styles: ``,
})
export class Index {
  private readonly current = signal(0);
}
