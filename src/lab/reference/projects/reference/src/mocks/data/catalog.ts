/*
  The catalog is an old system: one table per endpoint, column names straight from the database.
  TITLE_NM is a CHAR(40) column, so it comes back blank-padded. PUB_YR is a string.
  FMT_CD: HC hardcover, PB paperback, AB audiobook, EB e-book.
*/

export interface TitleRow {
  TITLE_ID: number;
  TITLE_NM: string;
  AUTH_ID: number;
  PUB_YR: string;
  ISBN_13: string;
  FMT_CD: 'HC' | 'PB' | 'AB' | 'EB';
}

export interface AuthorRow {
  AUTH_ID: number;
  AUTH_LAST_NM: string;
  AUTH_FIRST_NM: string;
}

const char40 = (s: string) => s.padEnd(40, ' ');

export const authors: AuthorRow[] = [
  { AUTH_ID: 501, AUTH_LAST_NM: 'HERBERT', AUTH_FIRST_NM: 'FRANK' },
  { AUTH_ID: 502, AUTH_LAST_NM: 'LE GUIN', AUTH_FIRST_NM: 'URSULA K.' },
  { AUTH_ID: 503, AUTH_LAST_NM: 'BUTLER', AUTH_FIRST_NM: 'OCTAVIA E.' },
  { AUTH_ID: 504, AUTH_LAST_NM: 'GIBSON', AUTH_FIRST_NM: 'WILLIAM' },
  { AUTH_ID: 505, AUTH_LAST_NM: 'SHELLEY', AUTH_FIRST_NM: 'MARY' },
  { AUTH_ID: 506, AUTH_LAST_NM: 'AUSTEN', AUTH_FIRST_NM: 'JANE' },
  { AUTH_ID: 507, AUTH_LAST_NM: 'MORRISON', AUTH_FIRST_NM: 'TONI' },
  { AUTH_ID: 508, AUTH_LAST_NM: 'TOLKIEN', AUTH_FIRST_NM: 'J. R. R.' },
];

export const titles: TitleRow[] = [
  {
    TITLE_ID: 1001,
    TITLE_NM: char40('Dune'),
    AUTH_ID: 501,
    PUB_YR: '1965',
    ISBN_13: '9780441013593',
    FMT_CD: 'PB',
  },
  {
    TITLE_ID: 1002,
    TITLE_NM: char40('The Left Hand of Darkness'),
    AUTH_ID: 502,
    PUB_YR: '1969',
    ISBN_13: '9780441478125',
    FMT_CD: 'PB',
  },
  {
    TITLE_ID: 1003,
    TITLE_NM: char40('A Wizard of Earthsea'),
    AUTH_ID: 502,
    PUB_YR: '1968',
    ISBN_13: '9780547773742',
    FMT_CD: 'HC',
  },
  {
    TITLE_ID: 1004,
    TITLE_NM: char40('The Dispossessed'),
    AUTH_ID: 502,
    PUB_YR: '1974',
    ISBN_13: '9780061054884',
    FMT_CD: 'PB',
  },
  {
    TITLE_ID: 1005,
    TITLE_NM: char40('Kindred'),
    AUTH_ID: 503,
    PUB_YR: '1979',
    ISBN_13: '9780807083697',
    FMT_CD: 'PB',
  },
  {
    TITLE_ID: 1006,
    TITLE_NM: char40('Parable of the Sower'),
    AUTH_ID: 503,
    PUB_YR: '1993',
    ISBN_13: '9781538732182',
    FMT_CD: 'AB',
  },
  {
    TITLE_ID: 1007,
    TITLE_NM: char40('Neuromancer'),
    AUTH_ID: 504,
    PUB_YR: '1984',
    ISBN_13: '9780441569595',
    FMT_CD: 'PB',
  },
  {
    TITLE_ID: 1008,
    TITLE_NM: char40('Frankenstein'),
    AUTH_ID: 505,
    PUB_YR: '1818',
    ISBN_13: '9780486282114',
    FMT_CD: 'PB',
  },
  {
    TITLE_ID: 1009,
    TITLE_NM: char40('Pride and Prejudice'),
    AUTH_ID: 506,
    PUB_YR: '1813',
    ISBN_13: '9780141439518',
    FMT_CD: 'PB',
  },
  {
    TITLE_ID: 1010,
    TITLE_NM: char40('Beloved'),
    AUTH_ID: 507,
    PUB_YR: '1987',
    ISBN_13: '9781400033416',
    FMT_CD: 'HC',
  },
  {
    TITLE_ID: 1011,
    TITLE_NM: char40('The Hobbit'),
    AUTH_ID: 508,
    PUB_YR: '1937',
    ISBN_13: '9780547928227',
    FMT_CD: 'HC',
  },
  {
    TITLE_ID: 1012,
    TITLE_NM: char40('Dune Messiah'),
    AUTH_ID: 501,
    PUB_YR: '1969',
    ISBN_13: '9780593098233',
    FMT_CD: 'EB',
  },
];
