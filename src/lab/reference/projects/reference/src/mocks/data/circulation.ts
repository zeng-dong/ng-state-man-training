/*
  Circulation: copies and loans, in the same old-system style as the catalog.
  Dates are YYYYMMDD strings. (Holds are real now: they live in src/Backend.)

  STATUS_CD, as documented: A available, O on loan, H on the hold shelf, T in transit.
  (Instructor note: a few copies are 'M', missing, which the "documentation" never mentions.)
*/

export interface CopyRow {
  COPY_ID: number;
  TITLE_ID: number;
  BRANCH_CD: string;
  STATUS_CD: string;
  DUE_DT: string | null;
}

export interface LoanRow {
  LOAN_ID: number;
  COPY_ID: number;
  TITLE_ID: number;
  PATRON_ID: string;
  OUT_DT: string;
  RET_DT: string | null;
}

/** The patron the lab app is "signed in" as. */
export const currentPatronId = 'P0042';

type CopySeed = [branch: string, status: string, due?: string];

const copySeeds: Record<number, CopySeed[]> = {
  1001: [
    ['CEN', 'O', '20261021'],
    ['CEN', 'O', '20261028'],
    ['NOR', 'O', '20261019'],
    ['RIV', 'H'],
  ],
  1002: [
    ['CEN', 'A'],
    ['RIV', 'O', '20261030'],
  ],
  1003: [
    ['CEN', 'A'],
    ['NOR', 'A'],
    ['OAK', 'A'],
  ],
  1004: [['CEN', 'M']],
  1005: [
    ['CEN', 'O', '20261017'],
    ['NOR', 'T'],
    ['RIV', 'A'],
  ],
  1006: [['CEN', 'O', '20261025']],
  1007: [
    ['NOR', 'A'],
    ['RIV', 'M'],
    ['CEN', 'O', '20261101'],
  ],
  1008: [
    ['CEN', 'A'],
    ['NOR', 'A'],
    ['RIV', 'A'],
    ['OAK', 'A'],
  ],
  1009: [
    ['CEN', 'A'],
    ['CEN', 'O', '20261022'],
    ['NOR', 'A'],
  ],
  1010: [
    ['CEN', 'O', '20261020'],
    ['RIV', 'O', '20261027'],
  ],
  1011: [
    ['CEN', 'A'],
    ['NOR', 'O', '20261018'],
    ['RIV', 'T'],
    ['OAK', 'A'],
  ],
  // 1012 (the e-book) has no physical copies at all
};

let nextCopyId = 70001;
export const copies: CopyRow[] = Object.entries(copySeeds).flatMap(([titleId, seeds]) =>
  seeds.map(([branch, status, due]) => ({
    COPY_ID: nextCopyId++,
    TITLE_ID: Number(titleId),
    BRANCH_CD: branch,
    STATUS_CD: status,
    DUE_DT: due ?? null,
  })),
);

export const loans: LoanRow[] = [
  {
    LOAN_ID: 300101,
    COPY_ID: 70001,
    TITLE_ID: 1001,
    PATRON_ID: currentPatronId,
    OUT_DT: '20230612',
    RET_DT: '20230703',
  },
  {
    LOAN_ID: 300102,
    COPY_ID: 70008,
    TITLE_ID: 1003,
    PATRON_ID: currentPatronId,
    OUT_DT: '20240115',
    RET_DT: '20240129',
  },
  {
    LOAN_ID: 300103,
    COPY_ID: 70020,
    TITLE_ID: 1008,
    PATRON_ID: currentPatronId,
    OUT_DT: '20250930',
    RET_DT: '20251014',
  },
  {
    LOAN_ID: 300104,
    COPY_ID: 70014,
    TITLE_ID: 1006,
    PATRON_ID: currentPatronId,
    OUT_DT: '20260927',
    RET_DT: null,
  },
  {
    LOAN_ID: 300105,
    COPY_ID: 70002,
    TITLE_ID: 1001,
    PATRON_ID: currentPatronId,
    OUT_DT: '20251101',
    RET_DT: '20251130',
  },
];
