import { ChangeDetectionStrategy, Component, input, Input, signal } from '@angular/core';

// changeDetectionStrategy is now "on-push" by default.
// the data is "monitored" for changes if it is an input on the component
// or if it is an observable.
@Component({
  selector: 'app-signals-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <p>Signals</p>
    <p>Count is {{ current() }}</p>
    <button (click)="current.update((c) => c + 1)" class="btn btn-primary">Increment</button>
  `,
  styles: ``,
})
export class Signals101 {
  current = signal(0);

  // effect
  // computed
  // linkedSignal
}
