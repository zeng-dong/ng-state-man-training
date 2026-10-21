import { DatePipe } from '@angular/common';
import { Component, input, Resource } from '@angular/core';
import { Review } from './api';

@Component({
  selector: 'app-titles-after-reviews',
  imports: [DatePipe],
  template: `
    <section>
      <h2 class="text-xl font-semibold mb-2">Reviews</h2>
      @if (reviews().hasValue()) {
        @for (review of reviews().value(); track review.id) {
          <blockquote class="border-l-4 border-base-300 pl-4 mb-4">
            <p>
              <span [attr.aria-label]="review.rating + ' out of 5 stars'">{{
                '★'.repeat(review.rating)
              }}</span>
              {{ review.body }}
            </p>
            <footer class="text-sm opacity-70">
              {{ review.reviewer }}, {{ review.createdAt | date }}
            </footer>
          </blockquote>
        } @empty {
          <p>No reviews yet.</p>
        }
      } @else if (reviews().error()) {
        <div role="alert" class="alert alert-warning">Reviews aren't available right now.</div>
      } @else {
        <div class="skeleton h-24 w-full"></div>
      }
    </section>
  `,
})
export class Reviews {
  readonly reviews = input.required<Resource<Review[]>>();
}
