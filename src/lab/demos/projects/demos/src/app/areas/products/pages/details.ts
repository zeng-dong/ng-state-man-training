import { Component, input, Resource } from '@angular/core';
import { ProductDetailsModel, ProductModel } from '../types';
import { HttpResourceRef } from '@angular/common/http';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-products-details',
  imports: [CurrencyPipe],
  template: `
    <div class="bg-base-100 rounded-md p-4 m-4">
      @if (product().hasValue()) {
        <p class="text-lg font-bold">{{ product().value().name }}</p>
        <p>Price: {{ product().value().price | currency }}</p>
        <p>Description: {{ product().value().description }}</p>
      }
      @if (product().isLoading()) {
        <div class="flex w-64 flex-col gap-4">
          <div class="skeleton h-4 w-28"></div>
          <div class="skeleton h-4 w-full"></div>
          <div class="skeleton h-4 w-full"></div>
        </div>
      }
    </div>
  `,
  styles: ``,
})
export class Details {
  product = input.required<HttpResourceRef<ProductDetailsModel>>();
}
