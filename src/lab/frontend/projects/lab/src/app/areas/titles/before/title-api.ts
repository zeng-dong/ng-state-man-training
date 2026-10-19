import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';

const CATALOG_URL = 'https://catalog.hypertheory-labs.dev';
const CIRCULATION_URL = 'https://circulation.hypertheory-labs.dev';
const BRANCHES_URL = 'https://branches.hypertheory-labs.dev';
const REVIEWS_URL = 'https://reviews.hypertheory-labs.dev';
const HOLDS_URL = 'http://localhost:5261';

// TODO: get this from the auth service
export const CURRENT_PATRON_ID = 'P0042';

export interface TitleRow {
  TITLE_ID: number;
  TITLE_NM: string;
  AUTH_ID: number;
  PUB_YR: string;
  ISBN_13: string;
  FMT_CD: string;
}

export interface AuthorRow {
  AUTH_ID: number;
  AUTH_LAST_NM: string;
  AUTH_FIRST_NM: string;
}

export interface CopyRow {
  COPY_ID: number;
  TITLE_ID: number;
  BRANCH_CD: string;
  STATUS_CD: 'A' | 'O' | 'H' | 'T';
  DUE_DT: string | null;
}

export interface BranchRow {
  BRANCH_CD: string;
  BRANCH_NM: string;
  OPEN_FLG: string;
}

export interface Hold {
  id: string;
  titleId: number;
  patronId: string;
  status: string;
}

export interface LoanRow {
  LOAN_ID: number;
  COPY_ID: number;
  TITLE_ID: number;
  PATRON_ID: string;
  OUT_DT: string;
  RET_DT: string | null;
}

export interface Review {
  id: string;
  titleId: string;
  rating: number;
  body: string;
  reviewer: { displayName: string };
  createdAt: string;
}

export interface TitleDetail {
  title: TitleRow;
  author: AuthorRow;
  copies: CopyRow[];
  branches: BranchRow[];
  holds: Hold[];
  loans: LoanRow[];
  reviews: Review[];
}

@Service()
export class TitleApi {
  private readonly http = inject(HttpClient);

  getTitles(): Observable<TitleRow[]> {
    return this.http.get<TitleRow[]>(`${CATALOG_URL}/titles`);
  }

  /** Everything the title page needs, in one call. */
  getTitleDetail(titleId: number): Observable<TitleDetail> {
    return this.http.get<TitleRow>(`${CATALOG_URL}/titles/${titleId}`).pipe(
      switchMap((title) =>
        forkJoin({
          title: of(title),
          author: this.http.get<AuthorRow>(`${CATALOG_URL}/authors/${title.AUTH_ID}`),
          copies: this.http.get<CopyRow[]>(`${CIRCULATION_URL}/copies`, { params: { titleId } }),
          branches: this.http.get<BranchRow[]>(`${BRANCHES_URL}/branches`),
          holds: this.http.get<Hold[]>(`${HOLDS_URL}/holds`, { params: { titleId } }),
          loans: this.http.get<LoanRow[]>(`${CIRCULATION_URL}/loans`, {
            params: { titleId, patronId: CURRENT_PATRON_ID },
          }),
          reviews: this.http
            .get<{ items: Review[] }>(`${REVIEWS_URL}/reviews`, { params: { titleId } })
            .pipe(map((r) => r.items)),
        }),
      ),
    );
  }
}
