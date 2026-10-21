/*
  The boundary: what the four systems send, and what the UI works with.
  DTOs are translated once, here (as httpResource `parse` functions), so no
  component ever sees TITLE_NM, STATUS_CD, or a YYYYMMDD string.
*/

export const apiUrls = {
  catalog: 'https://catalog.hypertheory-labs.dev',
  circulation: 'https://circulation.hypertheory-labs.dev',
  branches: 'https://branches.hypertheory-labs.dev',
  reviews: 'https://reviews.hypertheory-labs.dev',
  /** The real API (src/Backend). */
  holds: 'http://localhost:5261',
};

// --- what the UI uses ---

export type Format = 'Hardcover' | 'Paperback' | 'Audiobook' | 'E-book' | 'Other';

export interface Title {
  id: number;
  name: string;
  authorId: number;
  year: string;
  format: Format;
}

export interface Author {
  name: string;
}

export type CopyStatus =
  | { kind: 'available' }
  | { kind: 'checked-out'; due: Date | null }
  | { kind: 'hold-shelf' }
  | { kind: 'in-transit' }
  | { kind: 'unknown'; code: string };

export interface Copy {
  id: number;
  branchCode: string;
  status: CopyStatus;
}

export interface Branch {
  code: string;
  name: string;
}

/** Someone waiting for a copy. */
export interface WaitingHold {
  id: string;
}

export interface Review {
  id: string;
  rating: number;
  body: string;
  reviewer: string;
  createdAt: Date;
}

// --- what the systems send ---

interface TitleDto {
  TITLE_ID: number;
  TITLE_NM: string;
  AUTH_ID: number;
  PUB_YR: string;
  FMT_CD: string;
}

interface AuthorDto {
  AUTH_LAST_NM: string;
  AUTH_FIRST_NM: string;
}

interface CopyDto {
  COPY_ID: number;
  BRANCH_CD: string;
  STATUS_CD: string;
  DUE_DT: string | null;
}

interface BranchDto {
  BRANCH_CD: string;
  BRANCH_NM: string;
}

interface ReviewsDto {
  items: {
    id: string;
    rating: number;
    body: string;
    reviewer: { displayName: string };
    createdAt: string;
  }[];
}

// --- translation ---

const formats: Record<string, Format> = {
  HC: 'Hardcover',
  PB: 'Paperback',
  AB: 'Audiobook',
  EB: 'E-book',
};

export function toTitle(raw: unknown): Title {
  const t = raw as TitleDto;
  return {
    id: t.TITLE_ID,
    name: t.TITLE_NM.trim(),
    authorId: t.AUTH_ID,
    year: t.PUB_YR,
    format: formats[t.FMT_CD] ?? 'Other',
  };
}

export function toTitles(raw: unknown): Title[] {
  return (raw as unknown[]).map(toTitle);
}

export function toAuthor(raw: unknown): Author {
  const a = raw as AuthorDto;
  return { name: `${titleCase(a.AUTH_FIRST_NM)} ${titleCase(a.AUTH_LAST_NM)}` };
}

export function toCopies(raw: unknown): Copy[] {
  return (raw as CopyDto[]).map((c) => ({
    id: c.COPY_ID,
    branchCode: c.BRANCH_CD,
    status: toStatus(c.STATUS_CD, c.DUE_DT),
  }));
}

export function toBranches(raw: unknown): Branch[] {
  return (raw as BranchDto[]).map((b) => ({ code: b.BRANCH_CD, name: b.BRANCH_NM }));
}

/** The wait list: holds that are requested or placed (a rejected hold isn't waiting). */
export function toWaitList(raw: unknown): WaitingHold[] {
  return (raw as { id: string; status: string }[])
    .filter((h) => h.status !== 'rejected')
    .map((h) => ({ id: h.id }));
}

export function toReviews(raw: unknown): Review[] {
  return (raw as ReviewsDto).items.map((r) => ({
    id: r.id,
    rating: r.rating,
    body: r.body,
    reviewer: r.reviewer.displayName,
    createdAt: new Date(r.createdAt),
  }));
}

function toStatus(code: string, due: string | null): CopyStatus {
  switch (code) {
    case 'A':
      return { kind: 'available' };
    case 'O':
      return { kind: 'checked-out', due: fromYyyymmdd(due) };
    case 'H':
      return { kind: 'hold-shelf' };
    case 'T':
      return { kind: 'in-transit' };
    default:
      // the systems send codes nobody documented; say so instead of showing nothing
      return { kind: 'unknown', code };
  }
}

function fromYyyymmdd(value: string | null) {
  if (!value || value.length !== 8) return null;
  return new Date(+value.slice(0, 4), +value.slice(4, 6) - 1, +value.slice(6, 8));
}

/** "LE GUIN" -> "Le Guin", "J. R. R." stays as is */
function titleCase(value: string) {
  return value.toLowerCase().replace(/(^|[\s.-])\p{L}/gu, (m) => m.toUpperCase());
}
