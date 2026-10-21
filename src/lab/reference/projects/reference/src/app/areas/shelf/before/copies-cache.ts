import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map, Observable, shareReplay } from 'rxjs';
import { apiUrls, Copy, toCopies } from '../../titles/after/api';

@Service()
export class CopiesCache {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, Observable<Copy[]>>();

  copiesFor(titleId: string): Observable<Copy[]> {
    if (!this.cache.has(titleId)) {
      this.cache.set(
        titleId,
        this.http
          .get<unknown>(`${apiUrls.circulation}/copies`, { params: { titleId } })
          .pipe(map(toCopies), shareReplay(1)),
      );
    }
    return this.cache.get(titleId)!;
  }
}
