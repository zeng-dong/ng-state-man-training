import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { mergeMap, tap } from 'rxjs';
import { TitleApi, TitleDetail as TitleDetailData } from './title-api';
import { TitleList } from './title-list';

@Component({
  selector: 'app-titles-before-detail',
  imports: [TitleList],
  template: `
    <div class="flex gap-6">
      <app-titles-before-list />

      <div class="flex-1">
        @if (loading()) {
          <div class="flex justify-center p-12">
            <span class="loading loading-spinner loading-lg"></span>
          </div>
        } @else if (error()) {
          <div role="alert" class="alert alert-error">
            Something went wrong loading this title. Please try again later.
          </div>
        } @else if (data(); as d) {
          <article class="flex flex-col gap-6">
            <header>
              <h1 class="text-3xl font-bold">{{ d.title.TITLE_NM.trim() }}</h1>
              <p class="text-lg">
                {{ d.author.AUTH_FIRST_NM }} {{ d.author.AUTH_LAST_NM }} · {{ d.title.PUB_YR }} ·
                @switch (d.title.FMT_CD) {
                  @case ('HC') {
                    Hardcover
                  }
                  @case ('PB') {
                    Paperback
                  }
                  @case ('AB') {
                    Audiobook
                  }
                  @case ('EB') {
                    E-book
                  }
                }
              </p>
            </header>

            <section>
              <h2 class="text-xl font-semibold mb-2">Availability</h2>
              @if (d.copies.length === 0) {
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
                    @for (copy of d.copies; track copy.COPY_ID) {
                      <tr>
                        <td>{{ branchName(copy.BRANCH_CD) }}</td>
                        <td>
                          @switch (copy.STATUS_CD) {
                            @case ('A') {
                              Available
                            }
                            @case ('O') {
                              Checked out, due {{ formatDate(copy.DUE_DT) }}
                            }
                            @case ('H') {
                              On the hold shelf
                            }
                            @case ('T') {
                              In transit
                            }
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              }
              <p class="mt-2">
                @if (d.holds.length > 0) {
                  {{ d.holds.length }} {{ d.holds.length === 1 ? 'person is' : 'people are' }}
                  waiting.
                } @else {
                  No one is waiting.
                }
              </p>
            </section>

            @if (d.loans.length > 0) {
              <section>
                <h2 class="text-xl font-semibold mb-2">Your history</h2>
                <ul>
                  @for (loan of d.loans; track loan.LOAN_ID) {
                    <li>
                      Borrowed {{ formatDate(loan.OUT_DT) }}
                      @if (loan.RET_DT) {
                        , returned {{ formatDate(loan.RET_DT) }}
                      } @else {
                        (you have it now)
                      }
                    </li>
                  }
                </ul>
              </section>
            }

            <section>
              <h2 class="text-xl font-semibold mb-2">Reviews</h2>
              @for (review of d.reviews; track review.id) {
                <blockquote class="border-l-4 border-base-300 pl-4 mb-4">
                  <p>{{ '★'.repeat(review.rating) }} {{ review.body }}</p>
                  <footer class="text-sm opacity-70">{{ review.reviewer.displayName }}</footer>
                </blockquote>
              } @empty {
                <p>No reviews yet.</p>
              }
            </section>
          </article>
        }
      </div>
    </div>
  `,
})
export class TitleDetail implements OnInit {
  private readonly api = inject(TitleApi);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  data = signal<TitleDetailData | null>(null);
  loading = signal(true);
  error = signal(false);

  ngOnInit() {
    this.route.paramMap
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(false);
        }),
        mergeMap((params) => this.api.getTitleDetail(Number(params.get('titleId')))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (data) => {
          this.data.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }

  branchName(code: string) {
    return this.data()?.branches.find((b) => b.BRANCH_CD === code)?.BRANCH_NM ?? code;
  }

  /** 20261021 -> 10/21/2026 */
  formatDate(yyyymmdd: string | null) {
    if (!yyyymmdd) return '';
    return `${yyyymmdd.substring(4, 6)}/${yyyymmdd.substring(6, 8)}/${yyyymmdd.substring(0, 4)}`;
  }
}
