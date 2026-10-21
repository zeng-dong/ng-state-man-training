import { Component, input, Resource } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Author, Title } from './api';

@Component({
  selector: 'app-titles-after-title-page',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <article class="flex flex-col gap-6">
      <header>
        @if (title().hasValue()) {
          <h1 class="text-3xl font-bold">{{ title().value()!.name }}</h1>
          <p class="text-lg">
            @if (author().hasValue()) {
              {{ author().value()!.name }}
            } @else if (author().error()) {
              <span class="opacity-70">Author unavailable</span>
            } @else {
              <span class="skeleton inline-block h-5 w-32 align-middle"></span>
            }
            · {{ title().value()!.year }} · {{ title().value()!.format }}
          </p>
        } @else if (title().error()) {
          <div role="alert" class="alert alert-error">We couldn't load this title.</div>
        } @else {
          <div class="skeleton h-9 w-72 mb-2"></div>
          <div class="skeleton h-5 w-56"></div>
        }
      </header>

      <nav aria-label="Title sections">
        <ul class="menu menu-horizontal bg-base-200 rounded-box">
          <li><a routerLink="availability" routerLinkActive="menu-active">Availability</a></li>
          <li><a routerLink="reviews" routerLinkActive="menu-active">Reviews</a></li>
        </ul>
      </nav>

      <router-outlet />
    </article>
  `,
})
export class TitlePage {
  readonly title = input.required<Resource<Title>>();
  readonly author = input.required<Resource<Author>>();
}
