import { JsonPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component } from '@angular/core';

@Component({
  selector: 'app-products-todos',
  imports: [JsonPipe],
  template: `
    <pre>
    {{ resource.value() | json }}

       </pre>
  `,
  styles: ``,
})
export class Todos {
  resource = httpResource(() => 'https://jsonplaceholder.typicode.com/todos');
}
