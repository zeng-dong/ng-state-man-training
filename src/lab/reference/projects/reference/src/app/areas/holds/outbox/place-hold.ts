import { HttpClient, httpResource } from '@angular/common/http';
import { Component, computed, effect, inject, input, linkedSignal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, fromEvent, merge, throttleTime } from 'rxjs';
import { Events } from '@ngrx/signals/events';
import {
  Intent,
  isCandidate,
  mergeWithCandidates,
  OutboxStore,
  outboxEvents,
  readyToRetire,
} from 'outbox';
import {
  API_URL,
  BranchesLookup,
  CATALOG_URL,
  CURRENT_PATRON_ID,
  Hold,
  PatronPrefs,
} from '../after/api';
import { holdEvents } from './hold-events';
import { OutboxLog, OutboxLogView } from './outbox-log';
import { placeHold, PlaceHoldPayload } from './place-hold-intent';

/**
 * Place a Hold, through the outbox (Day 3). The same page as Lab 2's "after", with the
 * request handed to the outbox instead of a page store:
 *
 *   command in:  the click enqueues a place-hold intent; the outbox sends it
 *   events out:  this page listens for [Outbox] events and reloads its own list
 *   done:        rung one is a "Check status" button; rung two checks when the user comes
 *                back to the tab; rung three is the server telling us (server-sent events).
 *                Each rung is added, none replaces the one below: with the stream down, the
 *                page still works, just less promptly.
 *
 *   promotion:   the table merges memory with candidates; a decided intent is retired once
 *                its hold is in memory
 *
 * Not here yet: durability (a reload forgets the intents).
 */
@Component({
  selector: 'app-holds-outbox-place-hold',
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
        <button class="btn btn-primary" [disabled]="!pickupBranch() || sending()" (click)="place()">
          Place hold
        </button>
      </div>

      @for (intent of myIntents(); track intent.id) {
        <div
          role="status"
          class="alert"
          [class.alert-info]="!apologyFor(intent.id) && intent.state.status !== 'done'"
          [class.alert-success]="intent.state.status === 'done'"
          [class.alert-warning]="!!apologyFor(intent.id)"
        >
          <span>
            @if (apologyFor(intent.id); as apology) {
              {{ apology.message }}
            } @else if (intent.state.status === 'done') {
              Your hold on {{ intent.payload.titleName }} is placed.
            } @else {
              {{ receiptFor(intent.id) }}
            }
            <span class="badge badge-sm ms-2">{{ intent.state.status }}</span>
          </span>
          @if (intent.state.status === 'received') {
            <button class="btn btn-sm" (click)="checkStatus(intent.id)">Check status</button>
          }
          @if (intent.state.status === 'done' || apologyFor(intent.id)) {
            <button class="btn btn-sm btn-ghost" (click)="outbox.dismiss(intent.id)">
              Dismiss
            </button>
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
              @for (row of rows(); track row.id) {
                <tr [class.italic]="row.guess" [class.opacity-70]="row.guess">
                  <td>{{ row.titleId }}</td>
                  <td>{{ row.branchCode }}</td>
                  <td>
                    @if (row.guess) {
                      <span class="badge badge-sm badge-ghost"
                        >your request, not confirmed yet</span
                      >
                    } @else {
                      {{ row.status }} {{ row.reason }}
                    }
                  </td>
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

      <app-outbox-log />
    </div>
  `,
  imports: [OutboxLogView],
})
export class PlaceHoldWithOutbox {
  protected readonly outbox = inject(OutboxStore);
  private readonly http = inject(HttpClient);
  private readonly lookup = inject(BranchesLookup);
  private readonly log = inject(OutboxLog);

  readonly titleId = input.required<string>();

  private readonly title = httpResource<{ TITLE_NM: string }>(
    () => `${CATALOG_URL}/titles/${this.titleId()}`,
  );
  protected readonly titleName = computed(() => this.title.value()?.TITLE_NM.trim() ?? '');

  private readonly prefs = httpResource<PatronPrefs>(
    () => `${API_URL}/patrons/${CURRENT_PATRON_ID}/prefs`,
  );

  /** Memory: what the server says. The outbox never writes into it. */
  protected readonly myHolds = httpResource<Hold[]>(
    () => ({ url: `${API_URL}/holds`, params: { patronId: CURRENT_PATRON_ID } }),
    { defaultValue: [] },
  );

  protected readonly openBranches = computed(() =>
    this.lookup.branches.value().filter((b) => b.isOpen),
  );

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

  /** This title's intents: the guesses the outbox is tracking for this page. */
  protected readonly myIntents = computed(() =>
    this.outbox
      .entities()
      .filter(
        (i): i is Intent<PlaceHoldPayload> =>
          i.type === placeHold.name &&
          (i.payload as PlaceHoldPayload).titleId === Number(this.titleId()),
      ),
  );

  /**
   * The outbox sends every intent it's given (it only speaks mergeMap), so preventing a
   * double submit is the page's job: no second click while one is still on its way.
   */
  protected readonly sending = computed(() =>
    this.myIntents().some((i) => i.state.status === 'requested' || i.state.status === 'sent'),
  );

  /**
   * What the table shows: memory plus the guesses whose real version hasn't arrived. A guess
   * is visibly a guess (italic, labelled), and disappears the moment the server's row has its id.
   */
  protected readonly rows = computed(() =>
    mergeWithCandidates(this.myHolds.value(), this.outbox.candidates(placeHold), (h) => h.id).map(
      (row) =>
        isCandidate(row)
          ? { ...row.value, id: row.intentId, guess: true }
          : { ...row, guess: false },
    ),
  );

  constructor() {
    // Promotion: once a decided intent's hold is in memory, the guess has done its job. The
    // page (the owner of the memory) retires it, explicitly. This reacts to a condition and
    // issues a command; it doesn't copy one signal into another.
    effect(() => {
      const done = this.myIntents()
        .filter((i) => i.state.status === 'done')
        .map((i) => i.id);
      const ready = readyToRetire(done, this.myHolds.value(), (h) => h.id);
      untracked(() => ready.forEach((id) => this.outbox.retire(id)));
    });

    // Rung two of hearing about "done": when the user comes back to the tab, ask about anything
    // still waiting. (Coming back fires both focus and visibilitychange; one check is enough.)
    merge(
      fromEvent(window, 'focus'),
      fromEvent(document, 'visibilitychange').pipe(
        filter(() => document.visibilityState === 'visible'),
      ),
    )
      .pipe(throttleTime(1000), takeUntilDestroyed())
      .subscribe(() => this.checkEverythingWaiting('came back to the tab'));

    // Rung three: the server tells us. A decision about an intent we're tracking goes to the
    // outbox; "subscribed" (every connect and reconnect) means we may have missed one, so ask.
    // Decisions about intents this page isn't tracking (another tab, another title) are
    // ignored here; the outbox ignores ids it doesn't hold anyway.
    holdEvents(CURRENT_PATRON_ID)
      .pipe(takeUntilDestroyed())
      .subscribe((event) => {
        if (event.kind === 'subscribed') this.checkEverythingWaiting('(re)connected');
        else if (this.myIntents().some((i) => i.id === event.holdId)) {
          this.log.note(event.holdId, `told (server event): ${event.status}`);
          this.heard(event.holdId, event);
        }
      });

    // Events out: the outbox announces; this page decides what that means for its memory.
    inject(Events)
      .on(outboxEvents.intentReceived, outboxEvents.intentDone, outboxEvents.intentNeedsAttention)
      .pipe(takeUntilDestroyed())
      .subscribe(({ payload }) => {
        this.log.note(payload.intent.id, 'reloads its own list (GET /holds)');
        this.myHolds.reload();
      });
  }

  /** Command in: the moment the draft becomes an intent. */
  protected place() {
    // The rule, not just the UX: a second click can arrive before the re-render that
    // disables the button, so check the signal (it updates the moment enqueue runs).
    if (this.sending()) return;
    this.outbox.enqueue(placeHold, {
      titleId: Number(this.titleId()),
      titleName: this.titleName(),
      branchCode: this.pickupBranch(),
    });
  }

  private checkEverythingWaiting(why: string) {
    this.myIntents()
      .filter((i) => i.state.status === 'received')
      .forEach((i) => this.checkStatus(i.id, why));
  }

  /** Rung one of hearing about "done": ask, then tell the outbox what the server said. */
  protected checkStatus(intentId: string, why = 'check status') {
    this.log.note(intentId, `asks (${why}): GET /holds/{id}`);
    this.http.get<Hold>(`${API_URL}/holds/${intentId}`).subscribe((hold) => {
      this.log.note(intentId, `answer: ${hold.status}`);
      this.heard(intentId, hold);
    });
  }

  /** However the page found out (asking, or being told), the outbox hears it the same way. */
  private heard(intentId: string, hold: Pick<Hold, 'status' | 'reason'>) {
    if (hold.status === 'placed') this.outbox.resolve(intentId, { status: 'done' });
    if (hold.status === 'rejected') {
      this.outbox.resolve(intentId, {
        status: 'needs-attention',
        failure: { kind: 'rejected', detail: hold.reason ?? undefined },
      });
    }
    // still 'requested': nothing to say yet; the receipt is still true
  }

  protected receiptFor(intentId: string) {
    return this.outbox.receipts().find((r) => r.intentId === intentId)?.text ?? '';
  }

  protected apologyFor(intentId: string) {
    return this.outbox.apologies().find((a) => a.intentId === intentId);
  }
}

interface BranchChoices {
  options: string[];
  home: string | null | undefined;
}

function defaultBranch({ options, home }: BranchChoices) {
  return home && options.includes(home) ? home : (options[0] ?? '');
}
