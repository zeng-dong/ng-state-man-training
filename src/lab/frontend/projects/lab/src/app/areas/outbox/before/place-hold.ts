import { httpResource } from '@angular/common/http';
import { Component, computed, effect, inject, input, linkedSignal, untracked } from '@angular/core';
import { API_URL, BranchesLookup, CATALOG_URL, CURRENT_PATRON_ID, Hold, PatronPrefs } from '../api';
import { HoldRequestStore } from './hold-request-store';

@Component({
  selector: 'app-outbox-before-place-hold',
  providers: [HoldRequestStore],
  template: `
    <div class="flex flex-col gap-6 max-w-2xl">
      <h1 class="text-3xl font-bold">Place a hold: {{ titleName() }}</h1>

      <div class="flex items-end gap-4">
        <label class="flex flex-col gap-1">
          <span>Pickup branch</span>
          <select
            class="select"
            [disabled]="openBranches().length === 0"
            [value]="pickupBranch()"
            (change)="pickupBranch.set($any($event.target).value)"
          >
            @for (branch of openBranches(); track branch.id) {
              <option [value]="branch.id">{{ branch.name }}</option>
            }
          </select>
        </label>
        <button
          class="btn btn-primary"
          [disabled]="!pickupBranch() || request.busy()"
          (click)="placeHold()"
        >
          Place hold
        </button>
      </div>

      @if (request.statusText()) {
        <div
          role="status"
          class="alert"
          [class.alert-info]="!request.decided()"
          [class.alert-success]="request.status() === 'placed'"
          [class.alert-warning]="request.status() === 'rejected' || request.status() === 'failed'"
        >
          <span>{{ request.statusText() }}</span>
          @if (request.canCheckStatus()) {
            <button class="btn btn-sm" (click)="request.checkStatus()">Check status</button>
          }
          @if (request.canRetry()) {
            <button class="btn btn-sm" (click)="request.retry()">Try again</button>
          }
        </div>
      }

      <section>
        <h2 class="text-xl font-semibold mb-2">Your holds</h2>
        <table class="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Pickup</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            @if (myHolds.error()) {
              <tr>
                <td colspan="3">We couldn't load your holds right now.</td>
              </tr>
            } @else {
              @for (hold of myHolds.value(); track hold.id) {
                <tr>
                  <td>{{ hold.titleId }}</td>
                  <td>{{ hold.branchCode }}</td>
                  <td>{{ hold.status }} {{ hold.reason }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="3">
                    {{ myHolds.isLoading() ? 'Loading your holds…' : 'You have no holds.' }}
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </section>
    </div>
  `,
})
export class PlaceHold {
  protected readonly request = inject(HoldRequestStore);
  private readonly lookup = inject(BranchesLookup);

  readonly titleId = input.required<string>();

  // Keyed on the input, so a reused component never shows the previous title.
  private readonly title = httpResource<{ TITLE_NM: string }>(
    () => `${CATALOG_URL}/titles/${this.titleId()}`,
  );
  protected readonly titleName = computed(() => this.title.value()?.TITLE_NM.trim() ?? '');

  private readonly prefs = httpResource<PatronPrefs>(
    () => `${API_URL}/patrons/${CURRENT_PATRON_ID}/prefs`,
  );

  protected readonly myHolds = httpResource<Hold[]>(
    () => ({ url: `${API_URL}/holds`, params: { patronId: CURRENT_PATRON_ID } }),
    { defaultValue: [] },
  );

  protected readonly openBranches = computed(() =>
    this.lookup.branches.value().filter((b) => b.isOpen),
  );

  /**
   * The plunger: a default the user can override, which resets when what it depends on
   * changes. Defaults to the home branch (a pref) or the first open branch; a branch the user
   * picked is kept as long as it's still one of the options.
   *
   * The gotcha: a default and a choice look the same. The branches can arrive before the prefs,
   * so the first default is "first open branch"; when the home branch arrives, that earlier
   * default must not be mistaken for something the user chose. So the previous value is kept
   * only if it differs from what the previous source would have defaulted to.
   */
  protected readonly pickupBranch = linkedSignal<BranchChoices, string>({
    source: () => ({
      options: this.openBranches().map((b) => b.id),
      home: this.prefs.value()?.homeBranch,
    }),
    computation: (source, previous) => {
      const userChose = previous && previous.value !== defaultBranch(previous.source);
      if (userChose && source.options.includes(previous.value)) return previous.value;
      return defaultBranch(source);
    },
  });

  constructor() {
    // A side effect, not syncing state: refresh our memory of the list once the server has
    // said "received", and again once it has decided. Not on the click: a reload sent along
    // with the PUT can read the list before the hold is committed. (Using effect() to copy
    // one signal into another would be the mistake.)
    effect(() => {
      const status = this.request.status();
      if (status === 'requested' || this.request.decided()) {
        untracked(() => this.myHolds.reload());
      }
    });
  }

  protected placeHold() {
    this.request.place({
      titleId: Number(this.titleId()),
      titleName: this.titleName(),
      branchCode: this.pickupBranch(),
    });
  }
}

interface BranchChoices {
  options: string[];
  home: string | null | undefined;
}

function defaultBranch({ options, home }: BranchChoices) {
  return home && options.includes(home) ? home : (options[0] ?? '');
}
