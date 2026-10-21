import { httpResource } from '@angular/common/http';
import { Component, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, fromEvent, merge, throttleTime } from 'rxjs';
import { apiUrls, toCopies } from '../../titles/after/api';
import { onTheShelf } from '../shelf-text';

const asOfTime = new Intl.DateTimeFormat(undefined, { timeStyle: 'short' });

/**
 * "On the shelf" is a memory of what circulation said, and it starts going stale the moment
 * it arrives. So this page decided how stale it may be (until the user comes back to the
 * tab, or opens the page again) and says how old its answer is.
 */
@Component({
  selector: 'app-shelf-after',
  template: `
    <div class="flex flex-col gap-4 max-w-2xl">
      <h1 class="text-3xl font-bold">Is it on the shelf? (title {{ titleId() }})</h1>
      @if (copies.hasValue()) {
        <p class="text-xl">{{ sentence(copies.value().copies) }}</p>
        <p class="text-sm opacity-80 flex items-center gap-2">
          As of {{ asOf(copies.value().at) }}.
          <button class="btn btn-xs" [disabled]="copies.isLoading()" (click)="copies.reload()">
            Check again
          </button>
        </p>
      } @else if (copies.error()) {
        <div role="alert" class="alert alert-warning">We can't see the shelves right now.</div>
      } @else {
        <div class="skeleton h-8 w-80"></div>
      }
    </div>
  `,
})
export class OnTheShelf {
  readonly titleId = input.required<string>();

  /** Owned by this page: it's fetched when the page opens and forgotten when it closes. */
  protected readonly copies = httpResource(
    () => ({ url: `${apiUrls.circulation}/copies`, params: { titleId: this.titleId() } }),
    // the answer, and when we heard it
    { parse: (raw) => ({ copies: toCopies(raw), at: Date.now() }) },
  );

  protected readonly sentence = onTheShelf;
  protected asOf(at: number) {
    return asOfTime.format(at);
  }

  constructor() {
    // How stale may it be? Until the user comes back to the tab.
    merge(
      fromEvent(window, 'focus'),
      fromEvent(document, 'visibilitychange').pipe(
        filter(() => document.visibilityState === 'visible'),
      ),
    )
      .pipe(throttleTime(1000), takeUntilDestroyed())
      .subscribe(() => this.copies.reload());
  }
}
