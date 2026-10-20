import { Component, output } from '@angular/core';

@Component({
  selector: 'app-shared-resource-error-display',
  imports: [],
  template: ` <h3 class="font-extrabold text-2xl"><ng-content></ng-content></h3> `,
  styles: ``,
})
export class ResourceErrorDisplay {
  retryRequested = output<void>();
}
