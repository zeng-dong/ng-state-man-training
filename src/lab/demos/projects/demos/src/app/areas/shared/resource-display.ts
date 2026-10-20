import { HttpErrorResponse, HttpResourceRef } from '@angular/common/http';
import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-shared-resource-display',
  imports: [],
  template: `
    @let r = resource();

    <div class="flex flex-col">
      @if (r.hasValue()) {
        <ng-content></ng-content>
      } @else if (r.error()) {
        <div class="alert alert-error">
          <div class="flex flex-col gap-4">
            <ng-content select="app-shared-resource-error-display"> </ng-content>
            @switch (httpError()) {
              @case (404) {
                <p>For some reason, we couldn't locate that resource.</p>
              }
              @case (500) {
                <p>Something went wrong on the server.</p>
              }
              @case (401) {
                <p>Unauthorized access.</p>
              }
              @case (403) {
                <p>Forbidden access.</p>
              }
              @default {
                <p>Status: {{ httpError() }}</p>
              }
            }
            <button class="btn" (click)="resource().reload()">Retry</button>
          </div>
        </div>
      } @else if (r.isLoading()) {
        <div class="alert alert-info">
          <span class="loading loading-bars loading-xl"></span><span>Loading...</span>
        </div>
      }
    </div>
  `,
  styles: ``,
})
export class ResourceDisplay<T> {
  resource = input.required<HttpResourceRef<T>>();

  httpError = computed(() => {
    const e = this.resource()?.error();
    if (e) {
      return (e as HttpErrorResponse).status;
    } else {
      return undefined;
    }
  });
}
