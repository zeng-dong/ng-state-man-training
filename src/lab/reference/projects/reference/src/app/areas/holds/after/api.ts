import { httpResource } from '@angular/common/http';
import { Service } from '@angular/core';

export const API_URL = 'http://localhost:5261';
export const CATALOG_URL = 'https://catalog.hypertheory-labs.dev';

// TODO: get this from the auth service
export const CURRENT_PATRON_ID = 'P0042';

export interface Branch {
  id: string;
  name: string;
  isOpen: boolean;
}

export type HoldStatus = 'requested' | 'placed' | 'rejected';

export interface Hold {
  id: string;
  titleId: number;
  branchCode: string;
  status: HoldStatus;
  reason: string | null;
}

export interface PatronPrefs {
  homeBranch: string | null;
}

/**
 * The branch list is a lookup table: it changes maybe once a year, so it's loaded once for
 * the whole app and allowed to be hours stale. (The "before" fetched it on every click.)
 */
@Service()
export class BranchesLookup {
  readonly branches = httpResource<Branch[]>(() => `${API_URL}/branches`, { defaultValue: [] });
}
