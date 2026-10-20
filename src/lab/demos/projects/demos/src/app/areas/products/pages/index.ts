import { JsonPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component } from '@angular/core';
import { ResourceDisplay } from '../../shared/resource-display';

@Component({
  selector: 'app-products-index',
  imports: [ResourceDisplay, JsonPipe],
  template: `
    <p>Products Index Page</p>
    <app-shared-resource-display [resource]="productsResource">
      <pre>{{ productsResource.value() | json }} </pre>
    </app-shared-resource-display>
  `,
  styles: ``,
})
export class Index {
  private readonly productsResource = httpResource(() => '/api/products');
}
