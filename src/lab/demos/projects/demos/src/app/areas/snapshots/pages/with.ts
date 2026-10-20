import { CurrencyPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, debounced, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { Collapse } from '../../shared/widgets/collapse';
import { withPreviousValue } from '../../shared/utils/with-previous-value';

type Product = {
  id: string;
  name: string;
  price: number;
};
@Component({
  selector: 'app-snapshots-pages-with',
  imports: [CurrencyPipe, Collapse],
  template: `
    <app-shared-collapse title="No Snapshotting">
      <p>
        Put a delay on the HTTP request for products to observe the behavior without snapshotting.
      </p>
    </app-shared-collapse>
    <div class="w-full max-w-xs">
      <!-- the far right ("Any") means no filter, so maxPrice leaves the URL -->
      <input
        #mp
        type="range"
        min="10"
        max="60"
        step="10"
        class="range"
        aria-label="Maximum price"
        [value]="maxPrice() ?? 60"
        (change)="setMaxPrice(mp.valueAsNumber)"
      />
      <div class="flex justify-between px-2.5 mt-2 text-xs">
        <span>|</span>
        <span>|</span>
        <span>|</span>
        <span>|</span>
        <span>|</span>
        <span>|</span>
      </div>
      <div class="flex justify-between px-2.5 mt-2 text-xs">
        <span>10</span>
        <span>20</span>
        <span>30</span>
        <span>40</span>
        <span>50</span>
        <span>Any</span>
      </div>
    </div>

    <div
      class="grid gap-4 lg:grid-cols-5 grid-cols-3"
      [class.opacity-50]="productsResourceList.isLoading()"
    >
      @for (product of productsResourceList.value(); track product.id) {
        <div class="card border-2 border-accent rounded-none m-2 min-w-48">
          <div class="card-body">
            <h3 class="text-2xl font-extrabold">{{ product.name }}</h3>
            <p>{{ product.price | currency }}</p>
          </div>
        </div>
      }
    </div>
  `,
  styles: ``,
})
export class With {
  /** `?maxPrice=30` in the URL. Absent (or not a number) means no filter. */
  readonly maxPrice = input(undefined, { transform: optionalNumber });
  private readonly router = inject(Router);

  counter = 0; // because this has to use the old-skool change detection.

  protected setMaxPrice(value: number) {
    // queryParams null removes the param; merge keeps any others
    this.router.navigate([], {
      queryParams: { maxPrice: value > 50 ? null : value },
      queryParamsHandling: 'merge',
    });
  }
  // httpResource is *read only* and the primary tool for getting outside API data.
  // really. I mean it. Don't use rxjs if you just need a list of things.
  // spoiler: it *is* using rxjs, but hiding it.

  private readonly maxPriceDebounced = debounced(this.maxPrice, 500);

  _productsResource = httpResource<Product[]>(() => {
    const maxPrice = this.maxPriceDebounced.value();
    return {
      url: '/api/products',
      params: maxPrice === undefined ? undefined : { 'max-price': maxPrice },
    };
  });

  private readonly productsResourceList = withPreviousValue(this._productsResource);
}

function optionalNumber(value: string | undefined) {
  const n = value === undefined || value.trim() === '' ? NaN : Number(value);
  return Number.isNaN(n) ? undefined : n;
}
