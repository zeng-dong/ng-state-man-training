import { AsyncPipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { onTheShelf } from '../shelf-text';
import { CopiesCache } from './copies-cache';

@Component({
  selector: 'app-shelf-before',
  imports: [AsyncPipe],
  template: `
    <div class="flex flex-col gap-4 max-w-2xl">
      <h1 class="text-3xl font-bold">Is it on the shelf? (title {{ titleId() }})</h1>
      @if (cache.copiesFor(titleId()) | async; as copies) {
        <p class="text-xl">{{ sentence(copies) }}</p>
      } @else {
        <div class="skeleton h-8 w-80"></div>
      }
    </div>
  `,
})
export class OnTheShelf {
  protected readonly cache = inject(CopiesCache);
  readonly titleId = input.required<string>();
  protected readonly sentence = onTheShelf;
}
