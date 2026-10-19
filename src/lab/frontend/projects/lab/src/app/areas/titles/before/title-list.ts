import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TitleApi, TitleRow } from './title-api';

@Component({
  selector: 'app-titles-before-list',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav aria-label="Titles">
      <ul class="menu bg-base-200 rounded-box w-64">
        @for (title of titles(); track title.TITLE_ID) {
          <li>
            <a [routerLink]="['/titles/before', title.TITLE_ID]" routerLinkActive="menu-active">
              {{ title.TITLE_NM.trim() }}
            </a>
          </li>
        }
      </ul>
    </nav>
  `,
})
export class TitleList implements OnInit {
  private readonly api = inject(TitleApi);
  private readonly destroyRef = inject(DestroyRef);

  titles = signal<TitleRow[]>([]);

  ngOnInit() {
    this.api
      .getTitles()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((titles) => this.titles.set(titles));
  }
}
