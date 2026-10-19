/* A lookup table. It changes maybe once a year, which makes it a good "how stale may it be?" row. */

export interface BranchRow {
  BRANCH_CD: string;
  BRANCH_NM: string;
  OPEN_FLG: 'Y' | 'N';
}

export const branches: BranchRow[] = [
  { BRANCH_CD: 'CEN', BRANCH_NM: 'Central Library', OPEN_FLG: 'Y' },
  { BRANCH_CD: 'NOR', BRANCH_NM: 'Northside Branch', OPEN_FLG: 'Y' },
  { BRANCH_CD: 'RIV', BRANCH_NM: 'Riverside Branch', OPEN_FLG: 'Y' },
  { BRANCH_CD: 'OAK', BRANCH_NM: 'Oak Hill Branch', OPEN_FLG: 'N' },
];
