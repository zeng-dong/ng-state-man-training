import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Events } from '@ngrx/signals/events';
import { outboxEvents } from './events';
import { OutboxStore } from './outbox-store';
import { provideIntentTypes } from './registry';
import { defineIntentType } from './types';

interface PlaceHold {
  titleId: number;
  title: string;
}

const placeHold = defineIntentType<PlaceHold, { id: string; title: string }>({
  name: 'place-hold',
  request: (intent) => ({ method: 'PUT', url: `/holds/${intent.id}`, body: intent.payload }),
  receipt: ({ payload }) => `We've received your request to place a hold on ${payload.title}.`,
  candidate: ({ id, payload }) => ({ id, title: payload.title }),
  apology: {
    say: ({ payload }, failure) =>
      failure.kind === 'timeout'
        ? `We're not sure your hold on ${payload.title} went through.`
        : `We couldn't place a hold on ${payload.title}.`,
    actions: ['retry'],
  },
  timeoutMs: 5_000,
});

const dune = { titleId: 1001, title: 'Dune' };

function setup() {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), provideIntentTypes(placeHold)],
  });
  const store = TestBed.inject(OutboxStore);
  const http = TestBed.inject(HttpTestingController);
  const seen: string[] = [];
  TestBed.inject(Events)
    .on(...Object.values(outboxEvents))
    .subscribe((e) => seen.push(e.type));
  return { store, http, seen };
}

const statusOf = (store: ReturnType<typeof setup>['store'], id: string) =>
  store.entityMap()[id]?.state.status;

describe('OutboxStore', () => {
  afterEach(() => vi.useRealTimers());

  it('sends the declared request, with the intent id as the idempotency key', () => {
    const { store, http } = setup();
    const intent = store.enqueue(placeHold, dune);

    const req = http.expectOne(`/holds/${intent.id}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(dune);
    expect(req.request.headers.get('Idempotency-Key')).toBe(intent.id);
    expect(statusOf(store, intent.id)).toBe('sent');
  });

  it('requested → sent → done, publishing an event at each step', () => {
    const { store, http, seen } = setup();
    const intent = store.enqueue(placeHold, dune);
    http.expectOne(`/holds/${intent.id}`).flush({}, { status: 201, statusText: 'Created' });

    expect(statusOf(store, intent.id)).toBe('done');
    expect(seen).toEqual([
      '[Outbox] intentRequested',
      '[Outbox] intentSent',
      '[Outbox] intentDone',
    ]);
  });

  it('a 202 is received, not done', () => {
    const { store, http } = setup();
    const intent = store.enqueue(placeHold, dune);
    http.expectOne(`/holds/${intent.id}`).flush(null, { status: 202, statusText: 'Accepted' });

    expect(statusOf(store, intent.id)).toBe('received');
    store.resolve(intent.id, { status: 'done' });
    expect(statusOf(store, intent.id)).toBe('done');
  });

  it('a rejection needs attention, and its apology is the declared one', () => {
    const { store, http } = setup();
    const intent = store.enqueue(placeHold, dune);
    http
      .expectOne(`/holds/${intent.id}`)
      .flush({ detail: 'Hold limit reached' }, { status: 409, statusText: 'Conflict' });

    expect(statusOf(store, intent.id)).toBe('needs-attention');
    expect(store.apologies()).toEqual([
      {
        intentId: intent.id,
        status: 'needs-attention',
        message: "We couldn't place a hold on Dune.",
        actions: ['retry'],
      },
    ]);
  });

  it('a network error is failed-to-send', () => {
    const { store, http } = setup();
    const intent = store.enqueue(placeHold, dune);
    http.expectOne(`/holds/${intent.id}`).error(new ProgressEvent('error'));

    expect(statusOf(store, intent.id)).toBe('failed-to-send');
  });

  it('no answer in time is unknown, not failure, and a late answer still lands', () => {
    vi.useFakeTimers();
    const { store, http } = setup();
    const intent = store.enqueue(placeHold, dune);
    const req = http.expectOne(`/holds/${intent.id}`);

    vi.advanceTimersByTime(5_000);
    expect(statusOf(store, intent.id)).toBe('unknown');
    expect(store.apologies()[0].message).toBe("We're not sure your hold on Dune went through.");

    req.flush({}, { status: 201, statusText: 'Created' });
    expect(statusOf(store, intent.id)).toBe('done');
    expect(store.apologies()).toEqual([]);
  });

  it('a decision is final: a late 202 after the outcome is known does not undo it', () => {
    vi.useFakeTimers();
    const { store, http, seen } = setup();
    const intent = store.enqueue(placeHold, dune);
    const req = http.expectOne(`/holds/${intent.id}`);

    vi.advanceTimersByTime(5_000); // unknown
    store.resolve(intent.id, { status: 'done' }); // the server told us some other way
    req.flush(null, { status: 202, statusText: 'Accepted' }); // the PUT's answer, late

    expect(statusOf(store, intent.id)).toBe('done');
    expect(seen.filter((t) => t === '[Outbox] intentReceived')).toEqual([]);
  });

  it('receipts are always true; candidates are wrapped guesses that stop when the guess fails', () => {
    const { store, http } = setup();
    const intent = store.enqueue(placeHold, dune);

    expect(store.receipts()[0].text).toBe("We've received your request to place a hold on Dune.");
    expect(store.candidates(placeHold)).toEqual([
      { kind: 'candidate', intentId: intent.id, value: { id: intent.id, title: 'Dune' } },
    ]);

    http.expectOne(`/holds/${intent.id}`).flush(null, { status: 409, statusText: 'Conflict' });
    expect(store.candidates(placeHold)).toEqual([]);
  });

  it('retiring (promotion) and dismissing remove the intent, and say so once', () => {
    const { store, http, seen } = setup();
    const placed = store.enqueue(placeHold, dune);
    http.expectOne(`/holds/${placed.id}`).flush({}, { status: 201, statusText: 'Created' });
    const refused = store.enqueue(placeHold, dune);
    http.expectOne(`/holds/${refused.id}`).flush(null, { status: 409, statusText: 'Conflict' });

    store.retire(placed.id);
    store.retire(placed.id); // already gone: nothing to say
    store.dismiss(refused.id);

    expect(store.entities()).toEqual([]);
    expect(seen.filter((t) => t.endsWith('Retired') || t.endsWith('Dismissed'))).toEqual([
      '[Outbox] intentRetired',
      '[Outbox] intentDismissed',
    ]);
  });

  it('refuses an unregistered intent type', () => {
    const { store } = setup();
    const stranger = defineIntentType({ ...placeHold, name: 'not-registered' });
    expect(() => store.enqueue(stranger, dune)).toThrow(/isn't registered/);
  });
});
