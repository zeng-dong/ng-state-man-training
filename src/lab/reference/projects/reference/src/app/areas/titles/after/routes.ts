import { httpResource } from '@angular/common/http';
import { computed } from '@angular/core';
import { nonBlocking, ResourceContext, Routes } from '@angular/router';
import { apiUrls, toAuthor, toBranches, toCopies, toReviews, toTitle, toWaitList } from './api';
import { Availability } from './availability';
import { Reviews } from './reviews';
import { Shell } from './shell';
import { TitlePage } from './title-page';

/*
  Each route owns the data it shows. Resources across the matched routes load in parallel,
  and a section's requests only happen when its route is active.
  Child routes read :titleId because app.config sets paramsInheritanceStrategy: 'always'.
*/

/**
 * ctx.params() is a new object on every navigation, even to a child route, and httpResource
 * refetches whenever its request is rebuilt. A computed over the one param we need only
 * changes when the id does, so drilling into a section doesn't refetch the title.
 */
function titleIdOf(ctx: ResourceContext) {
  return computed(() => ctx.params()['titleId'] as string);
}
export const afterRoutes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      {
        path: ':titleId',
        component: TitlePage,
        resources: (ctx) => {
          const titleId = titleIdOf(ctx);
          const title = httpResource(() => `${apiUrls.catalog}/titles/${titleId()}`, {
            parse: toTitle,
          });
          // the one real dependency: the author needs the title's authorId
          const author = httpResource(
            () =>
              title.hasValue() ? `${apiUrls.catalog}/authors/${title.value().authorId}` : undefined,
            { parse: toAuthor },
          );
          return { title: nonBlocking(title), author: nonBlocking(author) };
        },
        children: [
          {
            path: 'availability',
            component: Availability,
            resources: (ctx) => {
              const titleId = titleIdOf(ctx);
              return {
                copies: nonBlocking(
                  httpResource(
                    () => ({
                      url: `${apiUrls.circulation}/copies`,
                      params: { titleId: titleId() },
                    }),
                    { parse: toCopies },
                  ),
                ),
                branches: nonBlocking(
                  httpResource(() => `${apiUrls.branches}/branches`, { parse: toBranches }),
                ),
                holds: nonBlocking(
                  httpResource(
                    () => ({ url: `${apiUrls.holds}/holds`, params: { titleId: titleId() } }),
                    { parse: toWaitList },
                  ),
                ),
              };
            },
          },
          {
            path: 'reviews',
            component: Reviews,
            resources: (ctx) => {
              const titleId = titleIdOf(ctx);
              return {
                reviews: nonBlocking(
                  httpResource(
                    () => ({ url: `${apiUrls.reviews}/reviews`, params: { titleId: titleId() } }),
                    { parse: toReviews },
                  ),
                ),
              };
            },
          },
        ],
      },
    ],
  },
];
