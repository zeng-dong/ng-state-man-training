import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { withStellarDevtools } from '@hypertheory-labs/stellar-ng-devtools';
import { catchError, EMPTY, exhaustMap, map, Observable, pipe, tap } from 'rxjs';
import { API_URL, CURRENT_PATRON_ID, Hold } from './api';

/** What the user asked for. Created once per request, never per click. */
interface HoldIntent {
  /** Client-generated, once. Retrying resends this same id, so the server can dedupe. */
  id: string;
  titleId: number;
  titleName: string;
  branchCode: string;
}

type RequestStatus = 'idle' | 'sending' | 'requested' | 'placed' | 'rejected' | 'failed';

/**
 * The store as command handler. It passes the store test because it *decides* things:
 * the request's identity, whether a second click counts, and what is true to say about it.
 * (The patron's list of holds is a memory of the server's data, so it stays a resource.)
 */
export const HoldRequestStore = signalStore(
  withState({
    intent: null as HoldIntent | null,
    status: 'idle' as RequestStatus,
    reason: null as string | null,
  }),
  withStellarDevtools('HoldRequestStore', {
    description:
      'One hold request on the Place a Hold page: its client-generated id, where it is in its life (sending, requested, placed, rejected, failed), and why.',
  }),
  withComputed((store) => ({
    /** Something true to say, at every moment. */
    statusText: computed(() => {
      const intent = store.intent();
      if (!intent) return '';
      const at = `${intent.titleName} at ${intent.branchCode}`;
      switch (store.status()) {
        case 'sending':
          return `Sending your request for ${at}…`;
        case 'requested':
          return `We've received your request to place a hold on ${at}. Most requests are decided within a few seconds.`;
        case 'placed':
          return `Your hold on ${at} is placed.`;
        case 'rejected':
          return `We couldn't place your hold on ${at}: ${store.reason()}`;
        case 'failed':
          return `We couldn't reach the library to request ${at}. Your request may not have been received.`;
        default:
          return '';
      }
    }),
    busy: computed(() => store.status() === 'sending'),
    canCheckStatus: computed(() => store.status() === 'requested'),
    canRetry: computed(() => store.status() === 'failed'),
    decided: computed(() => store.status() === 'placed' || store.status() === 'rejected'),
  })),
  withMethods((store) => {
    const http = inject(HttpClient);

    /** PUT to the intent's own id: the same intent sent twice is one hold. */
    function send(intent: HoldIntent): Observable<unknown> {
      patchState(store, { status: 'sending', reason: null });
      return http
        .put<Hold>(
          `${API_URL}/holds/${intent.id}`,
          { patronId: CURRENT_PATRON_ID, titleId: intent.titleId, branchCode: intent.branchCode },
          { observe: 'response' },
        )
        .pipe(
          tap((response: HttpResponse<Hold>) => {
            // 202: received, not done. 200: a repeat of a request already decided.
            if (response.status === 202) patchState(store, { status: 'requested' });
            else record(response.body!);
          }),
          catchError((error: HttpErrorResponse) => {
            // Not "it failed": we may not know. The id is kept, so trying again is safe.
            patchState(store, {
              status: 'failed',
              reason: error.status === 0 ? null : (error.error?.detail ?? null),
            });
            return EMPTY;
          }),
        );
    }

    function record(hold: Hold) {
      patchState(store, { status: hold.status, reason: hold.reason });
    }

    return {
      /**
       * The moment a draft becomes an intent. exhaustMap is the policy: "ignore new ones
       * until this one finishes." (The button is also disabled; that's the UX, this is the rule.)
       */
      place: rxMethod<Omit<HoldIntent, 'id'>>(
        pipe(
          exhaustMap((request) => {
            const intent: HoldIntent = { id: crypto.randomUUID(), ...request };
            patchState(store, { intent });
            return send(intent);
          }),
        ),
      ),

      /** Same intent, same id. If the first attempt did land, the server just returns it. */
      retry: rxMethod<void>(pipe(exhaustMap(() => send(store.intent()!)))),

      /** Rung one of hearing about "done": ask. (Later: on focus, then pushed by the server.) */
      checkStatus: rxMethod<void>(
        pipe(
          exhaustMap(() =>
            http.get<Hold>(`${API_URL}/holds/${store.intent()!.id}`).pipe(
              map(record),
              catchError(() => EMPTY), // keep saying "requested": still true
            ),
          ),
        ),
      ),

      /** Start over for a new request. */
      reset() {
        patchState(store, { intent: null, status: 'idle', reason: null });
      },
    };
  }),
);
