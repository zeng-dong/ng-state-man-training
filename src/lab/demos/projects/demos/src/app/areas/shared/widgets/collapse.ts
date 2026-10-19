import { Component, input } from '@angular/core';

@Component({
  selector: 'app-shared-collapse',
  imports: [],
  template: `
    <div tabindex="0" class="collapse bg-base-100 border-base-300 border">
      <div class="collapse-title font-semibold">{{ title() }}</div>
      <div class="collapse-content text-sm prose prose-lg">
        @if (path()) {
          <pre>{{ path() }}</pre>
        }
        <ng-content />
      </div>
    </div>
  `,
  styles: ``,
})
export class Collapse {
  title = input.required<string>();
  path = input<string | undefined>(undefined);
}
