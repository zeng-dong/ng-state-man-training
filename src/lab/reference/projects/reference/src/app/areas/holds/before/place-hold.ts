import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

const CATALOG_URL = 'https://catalog.hypertheory-labs.dev';
const API_URL = 'http://localhost:5261';

// TODO: get this from the auth service
const CURRENT_PATRON_ID = 'P0042';

interface TitleRow {
  TITLE_ID: number;
  TITLE_NM: string;
}

interface Branch {
  id: string;
  name: string;
  isOpen: boolean;
}

interface Hold {
  id: string;
  titleId: number;
  branchCode: string;
  status: string;
  reason: string | null;
}

@Component({
  selector: 'app-holds-before-place-hold',
  template: `
    <div class="flex flex-col gap-6 max-w-2xl">
      <h1 class="text-3xl font-bold">Place a hold: {{ title()?.TITLE_NM?.trim() }}</h1>

      <div class="flex items-end gap-4">
        <label class="flex flex-col gap-1">
          <span>Pickup branch</span>
          <select
            class="select"
            (mousedown)="loadBranches()"
            (focus)="loadBranches()"
            (change)="branchCode.set($any($event.target).value)"
          >
            <option value="">Choose a branch</option>
            @for (branch of branches(); track branch.id) {
              <option [value]="branch.id">{{ branch.name }}</option>
            }
          </select>
        </label>
        <button class="btn btn-primary" [disabled]="!branchCode()" (click)="placeHold()">
          Place hold
        </button>
      </div>

      @if (message()) {
        <div role="status" class="alert alert-info">{{ message() }}</div>
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
            @for (hold of myHolds(); track hold.id) {
              <tr>
                <td>{{ hold.titleId }}</td>
                <td>{{ hold.branchCode }}</td>
                <td>{{ hold.status }} {{ hold.reason }}</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="3">You have no holds.</td>
              </tr>
            }
          </tbody>
        </table>
      </section>
    </div>
  `,
})
export class PlaceHold implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  readonly titleId = input.required<string>();

  title = signal<TitleRow | null>(null);
  branches = signal<Branch[]>([]);
  branchCode = signal('');
  myHolds = signal<Hold[]>([]);
  message = signal('');

  ngOnInit() {
    this.http
      .get<TitleRow>(`${CATALOG_URL}/titles/${this.titleId()}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((title) => this.title.set(title));
    this.loadMyHolds();
  }

  /** Only load the branches when the user actually opens the list. */
  loadBranches() {
    this.http
      .get<Branch[]>(`${API_URL}/branches`)
      .subscribe((branches) => this.branches.set(branches));
  }

  placeHold() {
    // The API wants a client-generated id
    const id = crypto.randomUUID();
    this.http
      .put<Hold>(`${API_URL}/holds/${id}`, {
        patronId: CURRENT_PATRON_ID,
        titleId: Number(this.titleId()),
        branchCode: this.branchCode(),
      })
      .subscribe({
        next: () => {
          this.message.set(
            `Hold placed! We'll let you know when ${this.title()?.TITLE_NM.trim()} is ready.`,
          );
          this.loadMyHolds();
        },
        error: () => this.message.set('Something went wrong. Please try again.'),
      });
  }

  private loadMyHolds() {
    this.http
      .get<Hold[]>(`${API_URL}/holds`, { params: { patronId: CURRENT_PATRON_ID } })
      .subscribe((holds) => this.myHolds.set(holds));
  }
}
