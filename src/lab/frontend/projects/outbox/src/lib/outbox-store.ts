import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withProps } from '@ngrx/signals';
import { addEntity, removeEntity, updateEntity, withEntities } from '@ngrx/signals/entities';
import { injectDispatch } from '@ngrx/signals/events';
import { outboxEvents } from './events';
import { AnyIntentType, INTENT_TYPES } from './registry';
import {
  ApologyAction,
  Candidate,
  Failure,
  Intent,
  IntentState,
  IntentStatus,
  IntentType,
} from './types';

/** How long to wait for an answer before an intent is `unknown`, unless its type says. */
const DEFAULT_TIMEOUT_MS = 30_000;

/** What the UI can show about a pending intent. Always true. */
export interface Receipt {
  readonly intentId: string;
  readonly status: IntentStatus;
  readonly text: string;
}

/** What the UI owes the user about an intent whose guess didn't hold, or might not have. */
export interface ApologyNotice {
  readonly intentId: string;
  readonly status: IntentStatus;
  readonly message: string;
  readonly actions: readonly ApologyAction[];
}

/**
 * Phase 1: in memory. Holds intents, sends them, and walks each through its
 * lifecycle, publishing an event at every step. It owns the guesses, never the
 * app's data: features read receipts, candidates, and apologies from here, and
 * their own data from their own resources.
 */
export const OutboxStore = signalStore(
  { providedIn: 'root' },
  withEntities<Intent>(),
  withProps(() => ({
    _types: new Map(
      (inject(INTENT_TYPES, { optional: true }) ?? []).map((t) => [t.name, t] as const),
    ),
    _http: inject(HttpClient),
    _dispatch: injectDispatch(outboxEvents),
  })),
  withComputed((store) => {
    const typeOf = (intent: Intent) => store._types.get(intent.type)!;
    return {
      /** Every intent not yet retired or dismissed, with something true to say about it. */
      receipts: computed<Receipt[]>(() =>
        store.entities().map((intent) => ({
          intentId: intent.id,
          status: intent.state.status,
          text: typeOf(intent).receipt(intent),
        })),
      ),
      /** Intents that failed, or whose outcome we don't know, with their declared apology. */
      apologies: computed<ApologyNotice[]>(() =>
        store.entities().flatMap((intent) => {
          const failure = failureOf(intent.state);
          if (!failure) return [];
          const { apology } = typeOf(intent);
          return [
            {
              intentId: intent.id,
              status: intent.state.status,
              message: apology.say(intent, failure),
              actions: apology.actions,
            },
          ];
        }),
      ),
    };
  }),
  withMethods((store) => {
    const transitionEvents = {
      requested: store._dispatch.intentRequested,
      sent: store._dispatch.intentSent,
      received: store._dispatch.intentReceived,
      done: store._dispatch.intentDone,
      unknown: store._dispatch.intentUnknown,
      'needs-attention': store._dispatch.intentNeedsAttention,
      'failed-to-send': store._dispatch.intentFailedToSend,
    } satisfies Record<IntentStatus, unknown>;

    function current(id: string) {
      return store.entityMap()[id];
    }

    function moveTo(id: string, state: IntentState) {
      const now = current(id);
      if (!now) return; // retired or dismissed while in flight: nothing to update
      // A decision is final. Answers can arrive in any order (a slow 202 after a status check
      // or a server event already said "done"), and a late one must not undo what's known.
      if (now.state.status === 'done' || now.state.status === 'needs-attention') return;
      patchState(store, updateEntity({ id, changes: { state } }));
      transitionEvents[state.status]({ intent: current(id) });
    }

    function send(intent: Intent, type: AnyIntentType) {
      const { method, url, body } = type.request(intent);
      moveTo(intent.id, { status: 'sent', sentAt: Date.now() });

      // A timeout doesn't cancel the request: it may still land, and a late answer
      // moves the intent on from `unknown`. Unknown is "we don't know yet", not failure.
      const timer = setTimeout(() => {
        if (current(intent.id)?.state.status === 'sent') {
          moveTo(intent.id, { status: 'unknown', sentAt: Date.now() });
        }
      }, type.timeoutMs ?? DEFAULT_TIMEOUT_MS);

      store._http
        .request(method, url, {
          body,
          observe: 'response',
          headers: { 'Idempotency-Key': intent.id },
        })
        .subscribe({
          next: (response: HttpResponse<unknown>) => {
            clearTimeout(timer);
            moveTo(
              intent.id,
              response.status === 202
                ? { status: 'received', receivedAt: Date.now() }
                : { status: 'done', doneAt: Date.now() },
            );
          },
          error: (error: HttpErrorResponse) => {
            clearTimeout(timer);
            moveTo(intent.id, stateForError(error));
          },
        });
    }

    return {
      /**
       * The moment a draft becomes an intent. Returns the intent, whose id is also
       * the id the real item will have.
       */
      enqueue<TPayload>(type: IntentType<TPayload, unknown>, payload: TPayload): Intent<TPayload> {
        const registered = store._types.get(type.name);
        if (registered !== type) {
          throw new Error(
            `Intent type '${type.name}' isn't registered (provideIntentTypes in app.config). ` +
              `An unregistered intent couldn't be resumed or explained later.`,
          );
        }
        const intent: Intent<TPayload> = {
          id: crypto.randomUUID(),
          type: type.name,
          payload,
          requestedAt: Date.now(),
          state: { status: 'requested' },
          schema: 1,
        };
        // the store holds every type's intents; it never reads the payload
        patchState(store, addEntity(intent as Intent));
        store._dispatch.intentRequested({ intent });
        send(intent, registered as AnyIntentType);
        return intent;
      },

      /** Candidates of one intent type: guesses, wrapped so they can't pass for the real thing. */
      candidates<TCandidate>(type: IntentType<never, TCandidate>): Candidate<TCandidate>[] {
        if (!type.candidate) return [];
        return store
          .entities()
          .filter((intent) => intent.type === type.name && hasCandidate(intent.state))
          .map((intent) => ({
            kind: 'candidate',
            intentId: intent.id,
            value: type.candidate!(intent as Intent<never>),
          }));
      },

      /**
       * For a `received` intent whose outcome the app learned some other way
       * (in phase 1, the outbox doesn't poll).
       */
      resolve(
        id: string,
        outcome: { status: 'done' } | { status: 'needs-attention'; failure: Failure },
      ) {
        moveTo(id, outcome.status === 'done' ? { status: 'done', doneAt: Date.now() } : outcome);
      },

      /** Promotion: the feature's memory now contains the real item. */
      retire(id: string) {
        const intent = current(id);
        if (!intent) return;
        patchState(store, removeEntity(id));
        store._dispatch.intentRetired({ intent });
      },

      /** The user dismissed the apology. */
      dismiss(id: string) {
        const intent = current(id);
        if (!intent) return;
        patchState(store, removeEntity(id));
        store._dispatch.intentDismissed({ intent });
      },
    };
  }),
);

/** The failure an apology should speak to, if the state has one. */
function failureOf(state: IntentState): Failure | undefined {
  switch (state.status) {
    case 'needs-attention':
    case 'failed-to-send':
      return state.failure;
    case 'unknown':
      return { kind: 'timeout' };
    default:
      return undefined;
  }
}

/** A guess is still worth showing until the intent fails or is retired. */
function hasCandidate(state: IntentState) {
  return state.status !== 'needs-attention' && state.status !== 'failed-to-send';
}

function stateForError(error: HttpErrorResponse): IntentState {
  if (error.status === 0) {
    // As far as we can tell, it never reached the server.
    return { status: 'failed-to-send', failure: { kind: 'network' } };
  }
  const detail = (error.error as { detail?: unknown } | null)?.detail;
  return {
    status: 'needs-attention',
    failure: {
      kind: 'rejected',
      status: error.status,
      detail: typeof detail === 'string' ? detail : undefined,
    },
  };
}
