import { HttpClient, HttpErrorResponse, httpResource } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { API_URL, CURRENT_PATRON_ID, Hold } from '../../holds/after/api';
import { CancelDemoSetup } from '../demo-setup';

/** What the page knows about a cancel it asked for. Kept apart from the server's data. */
type CancelState = { status: 'cancelling' } | { status: 'failed'; message: string };

/**
 * Cancelling holds, with each cancel kept beside the memory instead of written into it.
 *
 * The row stays, dimmed and labelled, until the server's list no longer has it: the guess is
 * visible as a guess. A failed cancel is one sentence on its own row. Nothing reloads to
 * "undo" it, because nothing was changed that needs undoing, so no other row is touched.
 */
@Component({
  selector: 'app-cancel-after-my-holds',
  imports: [CancelDemoSetup],
  template: `
    <div class="flex flex-col gap-4 max-w-2xl">
      <h1 class="text-3xl font-bold">Your holds</h1>
      <app-cancel-demo-setup (ready)="myHolds.reload()" />

      <table class="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Pickup</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @if (myHolds.error()) {
            <tr>
              <td colspan="4">We couldn't load your holds right now.</td>
            </tr>
          } @else {
            @for (row of rows(); track row.id) {
              <tr [class.opacity-50]="row.cancel?.status === 'cancelling'">
                <td>{{ row.titleId }}</td>
                <td>{{ row.branchCode }}</td>
                <td>
                  @if (row.cancel?.status === 'cancelling') {
                    <span class="italic">cancelling…</span>
                  } @else {
                    {{ row.status }}
                  }
                </td>
                <td>
                  @if (canCancel(row)) {
                    <button class="btn btn-sm" (click)="cancel(row.id)">Cancel</button>
                  }
                </td>
              </tr>
              @if (row.cancel?.status === 'failed') {
                <tr>
                  <td colspan="4">
                    <div role="status" class="alert alert-warning">
                      <span>{{ failureText(row.cancel) }}</span>
                      <button class="btn btn-sm btn-ghost" (click)="forget(row.id)">Dismiss</button>
                    </div>
                  </td>
                </tr>
              }
            } @empty {
              <tr>
                <td colspan="4">
                  {{ myHolds.isLoading() ? 'Loading your holds…' : 'You have no holds.' }}
                </td>
              </tr>
            }
          }
        </tbody>
      </table>
    </div>
  `,
})
export class MyHolds {
  private readonly http = inject(HttpClient);

  /** Memory: what the server says. Cancelling never edits it. */
  protected readonly myHolds = httpResource<Hold[]>(
    () => ({ url: `${API_URL}/holds`, params: { patronId: CURRENT_PATRON_ID } }),
    { defaultValue: [] },
  );

  private readonly cancels = signal<Record<string, CancelState>>({});

  protected readonly rows = computed(() =>
    this.myHolds.value().map((hold) => ({ ...hold, cancel: this.cancels()[hold.id] })),
  );

  protected canCancel(row: Hold & { cancel?: CancelState }) {
    const cancellable = row.status === 'requested' || row.status === 'placed';
    return cancellable && row.cancel?.status !== 'cancelling';
  }

  /** Every cancel counts, in any order: each row's request is its own (mergeMap, by hand). */
  protected cancel(id: string) {
    if (this.cancels()[id]?.status === 'cancelling') return;
    this.set(id, { status: 'cancelling' });
    this.http.delete(`${API_URL}/holds/${id}`).subscribe({
      // Done when the server's list no longer has it; until then the row says "cancelling…".
      next: () => this.myHolds.reload(),
      // A 409 is the library's rule, written for people; anything else is ours to explain.
      error: (err: HttpErrorResponse) =>
        this.set(id, {
          status: 'failed',
          message: err.status === 409 ? (err.error?.detail ?? '') : '',
        }),
    });
  }

  protected failureText(cancel: CancelState | undefined) {
    const why = cancel?.status === 'failed' ? cancel.message : '';
    return `We couldn't cancel this hold${why ? `: ${why}` : '. It is still yours; try again in a moment.'}`;
  }

  protected forget(id: string) {
    this.cancels.update(({ [id]: _, ...rest }) => rest);
  }

  private set(id: string, state: CancelState) {
    this.cancels.update((all) => ({ ...all, [id]: state }));
  }
}
