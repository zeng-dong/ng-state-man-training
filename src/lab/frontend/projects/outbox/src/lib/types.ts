/*
  The outbox's vocabulary, as types. See this library's README.

  Two kinds of thing live here, and the split is deliberate:

  - DATA (Intent, IntentState, Failure): plain and serializable, because later
    phases store intents in IndexedDB and read them back in a new session. No
    functions, no class instances, no Dates (timestamps are epoch ms).

  - BEHAVIOR (IntentType): how to send an intent, what to say about it, what it
    might become, and how to apologize. Registered once per type, in code. A
    stored intent refers to its type by name, so behavior is never persisted.
*/

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

/** What the user asked for, as a message. */
export interface Intent<TPayload = unknown> {
  /** Client-generated (crypto.randomUUID()). Also the idempotency key. */
  readonly id: string;
  /** The registered IntentType's name, e.g. 'place-hold'. */
  readonly type: string;
  readonly payload: TPayload;
  /** When the user asked. Epoch ms. */
  readonly requestedAt: number;
  readonly state: IntentState;
  /** Shape version of this record, so stored intents can be upcast later. */
  readonly schema: 1;
}

/**
 * Where an intent is in its life: the worksheet's Part 2 diagram.
 *
 *   requested ─► sent ─► received ─► done
 *       │          │         │
 *       │          │         └─► needs-attention   (the outcome failed later)
 *       │          └─► unknown                      (sent, no answer in time)
 *       └─► failed-to-send                          (it never left)
 *
 * (Drafting happens before there is an intent at all: that's the form's state.)
 */
export type IntentState =
  | { readonly status: 'requested' }
  | { readonly status: 'sent'; readonly sentAt: number }
  | { readonly status: 'unknown'; readonly sentAt: number }
  | { readonly status: 'received'; readonly receivedAt: number }
  | { readonly status: 'done'; readonly doneAt: number }
  | { readonly status: 'needs-attention'; readonly failure: Failure }
  | { readonly status: 'failed-to-send'; readonly failure: Failure };

export type IntentStatus = IntentState['status'];

/** What went wrong, as data an apology can be specific about. */
export interface Failure {
  /**
   * - `rejected`: the server answered no (4xx/5xx).
   * - `network`: it never reached the server, as far as we can tell.
   * - `timeout`: no answer in time. Not the same as rejected: it may have landed.
   */
  readonly kind: 'rejected' | 'network' | 'timeout';
  /** HTTP status, when there was one. */
  readonly status?: number;
  /** Server-provided detail (e.g. a problem+json `detail`), when there was one. */
  readonly detail?: string;
}

// ---------------------------------------------------------------------------
// Guesses
// ---------------------------------------------------------------------------

/**
 * Something shaped like what an intent will become, staged before the server
 * answers. A wrapper, not a T, so a template can't render it as the real thing
 * by accident: you have to reach through `.value`, on purpose.
 */
export interface Candidate<T> {
  readonly kind: 'candidate';
  /** The intent this guess belongs to; also the id the real item will have. */
  readonly intentId: string;
  readonly value: T;
}

// ---------------------------------------------------------------------------
// Behavior
// ---------------------------------------------------------------------------

/** What the outbox needs to send an intent. Deliberately not an HttpRequest. */
export interface IntentRequest {
  readonly method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly url: string;
  readonly body?: unknown;
}

/** What the user can do about an apology. Dismissing is always available. */
export type ApologyAction = 'retry' | 'edit' | 'discard' | 'contact';

/** Declared with the intent type. If you can't describe it, you haven't earned the guess. */
export interface Apology<TPayload> {
  /** What the user is told. Gets the intent and the failure, so it can be specific. */
  say(intent: Intent<TPayload>, failure: Failure): string;
  readonly actions: readonly ApologyAction[];
}

/** Everything the outbox knows about one kind of intent. Registered, never stored. */
export interface IntentType<TPayload, TCandidate = never> {
  /** Stored on each intent; must stay stable across deploys. */
  readonly name: string;
  /** The request to send. Called each time the intent is sent. */
  request(intent: Intent<TPayload>): IntentRequest;
  /** Always true: "We've received your request to place a hold on Dune." */
  receipt(intent: Intent<TPayload>): string;
  /** Optional guess: what the request will look like if it succeeds. */
  candidate?(intent: Intent<TPayload>): TCandidate;
  readonly apology: Apology<TPayload>;
  /** How long to wait for an answer before the intent is `unknown`. */
  readonly timeoutMs?: number;
}

/** Identity function that exists so TypeScript can infer TPayload and TCandidate. */
export function defineIntentType<TPayload, TCandidate = never>(
  type: IntentType<TPayload, TCandidate>,
): IntentType<TPayload, TCandidate> {
  return type;
}
