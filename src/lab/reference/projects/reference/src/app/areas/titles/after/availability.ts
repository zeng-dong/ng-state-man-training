import { Component, computed, input, Resource } from '@angular/core';
import { Branch, Copy, CopyStatus, WaitingHold } from './api';

@Component({
  selector: 'app-titles-after-availability',
  template: `
    <section>
      <h2 class="text-xl font-semibold mb-2">Availability</h2>
      @if (copies().hasValue()) {
        @if (rows().length === 0) {
          <p>No physical copies.</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Branch</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              @for (row of rows(); track row.id) {
                <tr>
                  <td>{{ row.branch }}</td>
                  <td>
                    {{ row.statusText }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      } @else if (copies().error()) {
        <div role="alert" class="alert alert-warning">Availability isn't available right now.</div>
      } @else {
        <div class="skeleton h-32 w-full"></div>
      }

      <p class="mt-2">
        @if (holds().hasValue()) {
          @switch (holds().value()!.length) {
            @case (0) {
              No one is waiting.
            }
            @case (1) {
              1 person is waiting.
            }
            @default {
              {{ holds().value()!.length }} people are waiting.
            }
          }
        } @else if (holds().error()) {
          <span class="opacity-70">We can't see the wait list right now.</span>
        } @else {
          <span class="skeleton inline-block h-5 w-40 align-middle"></span>
        }
      </p>
    </section>
  `,
})
export class Availability {
  readonly copies = input.required<Resource<Copy[]>>();
  readonly branches = input.required<Resource<Branch[]>>();
  readonly holds = input.required<Resource<WaitingHold[]>>();

  /** The join, with no RxJS. If branches fails, show the code instead of nothing. */
  protected readonly rows = computed(() => {
    const names = new Map(
      (this.branches().hasValue() ? this.branches().value()! : []).map((b) => [b.code, b.name]),
    );
    return this.copies()
      .value()!
      .map((c) => ({
        id: c.id,
        branch: names.get(c.branchCode) ?? c.branchCode,
        statusText: describe(c.status),
      }));
  });
}

const dueDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

function describe(status: CopyStatus) {
  switch (status.kind) {
    case 'available':
      return 'Available';
    case 'checked-out':
      return status.due ? `Checked out, due ${dueDate.format(status.due)}` : 'Checked out';
    case 'hold-shelf':
      return 'On the hold shelf';
    case 'in-transit':
      return 'In transit';
    case 'unknown':
      return 'Status unknown (ask at the desk)';
  }
}
