import { CurrencyPipe, JsonPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, computed, effect, input, signal } from '@angular/core';
import { RouterLinkWithHref, RouterOutlet } from '@angular/router';
import { ProductModel, productSummaryItemListSchema } from '../types';
import { injectDispatch } from '@ngrx/signals/events';
import { httpErrorEvents } from '../../shared/error-handling/events';

@Component({
  selector: 'app-products-index',
  imports: [CurrencyPipe, RouterOutlet, RouterLinkWithHref, JsonPipe],
  template: `
    <p>Products Index Page</p>
    <div class="join">
      @if (sortKey() === 'price') {
        <a [routerLink]="['.', { sortKey: 'name' }]" class="join-item btn"> Sort by Name </a>
      } @else {
        <a [routerLink]="['.', { sortKey: 'price' }]" class="join-item btn"> Sort by Price </a>
      }
    </div>
    <div class="flex h-12">
      @if (productsResource.isLoading()) {
        <p>Getting your products...</p>
        <span class="loading loading-lg loading-ball"></span>
      }
    </div>
    @if (productsResource.hasValue()) {
      <div class="flex flex-row gap-4">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              <!-- row 1 -->
              @for (product of sortedProducts(); track product.id) {
                <tr>
                  <th>{{ product.id }}</th>
                  <td>
                    <a class="link" [routerLink]="['.', product.id]">{{ product.name }}</a>
                  </td>
                  <td>{{ product.price | currency }}</td>
                </tr>
              } @empty {
                <tr>
                  <th></th>
                  <td>No Products Available!</td>
                  <td></td>
                </tr>
              }
              <!-- row 2 -->
            </tbody>
          </table>
        </div>
        <div>
          <p>Details</p>
          <router-outlet />
        </div>
      </div>
    }

    @if (productsResource.error()) {
      <p>Blammo</p>
      <pre> {{ productsResource.error() | json }} </pre>
    }
  `,
  styles: ``,
})
export class Index {
  private readonly httpEvents = injectDispatch(httpErrorEvents);
  private name: string = 'joe';

  constructor() {
    effect((cleanupFn) => {
      const sortingBy = this.sortKey();
      console.log('Changed sorting to...' + sortingBy);
      const timerId = setInterval(() => {
        //this.productsResource.reload();
      }, 3000);
      cleanupFn(() => clearInterval(timerId));
    });
  }

  private readonly productsResource = httpResource<ProductModel[]>(() => '/api/products', {
    parse: (val) => {
      const parseResults = productSummaryItemListSchema.safeParse(val);
      if (parseResults.success) {
        return parseResults.data;
      } else {
        console.log(parseResults.error);
        // notify!
        this.httpEvents.malformedData({
          message: 'Cannot get the product list',
          zodError: parseResults.error,
          featureName: 'products',
        });
        // dispatch an action
        throw new Error('Malformed Data');
      }
    },
  });
  // list = input<HttpResourceRef<ProductModel[]>>();
  sortKey = input<'price' | 'name'>('name');
  sortedProducts = computed(() => {
    const list = this.productsResource.value() ?? [];
    // return list.toSorted((a, b) => (a.price === b.price ? 0 : a.price > b.price ? -1 : 1));
    if (this.sortKey() === 'name') {
      return list.toSorted((a, b) => a.name.localeCompare(b.name));
    } else {
      return list.toSorted((a, b) => (a.price === b.price ? 0 : a.price > b.price ? -1 : 1));
    }
  });
}
