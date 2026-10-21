import { Observable, retry } from 'rxjs';
import { API_URL } from '../after/api';

/** What the server's hold-events stream says. */
export type HoldEvent =
  | { kind: 'subscribed' }
  | {
      kind: 'hold-decided';
      holdId: string;
      titleId: number;
      status: 'placed' | 'rejected';
      reason: string | null;
    };

/** How long to wait before opening a new connection after the browser gives up on one. */
const RECONNECT_MS = 5_000;

/**
 * The server-sent events for one patron, as an Observable. Unsubscribing closes the connection.
 *
 * The server sends "subscribed" on every connection. There's no replay, so "subscribed" means
 * "you may have missed something: go and ask." A decision that happened while disconnected is
 * found by asking, not by the stream.
 *
 * EventSource retries some failures by itself (readyState goes back to CONNECTING), but not all:
 * restarting the API left Chrome's EventSource CLOSED for good (measured 2026-10-16). So when it
 * gives up, this errors, and `retry` opens a new one. A stream that's down meanwhile just means
 * rungs one and two still work.
 */
export function holdEvents(patronId: string): Observable<HoldEvent> {
  return new Observable<HoldEvent>((subscriber) => {
    const source = new EventSource(`${API_URL}/patrons/${patronId}/hold-events`);
    source.addEventListener('subscribed', () => subscriber.next({ kind: 'subscribed' }));
    source.addEventListener('hold-decided', (e) =>
      subscriber.next({ kind: 'hold-decided', ...JSON.parse((e as MessageEvent<string>).data) }),
    );
    source.addEventListener('error', () => {
      if (source.readyState === EventSource.CLOSED) subscriber.error(new Error('stream closed'));
    });
    return () => source.close();
  }).pipe(retry({ delay: RECONNECT_MS }));
}
