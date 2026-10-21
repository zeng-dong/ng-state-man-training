import { Candidate } from './types';

/** True for a guess, false for the server's version. Narrows the type for templates. */
export function isCandidate<T>(item: T | Candidate<T>): item is Candidate<T> {
  return typeof item === 'object' && item !== null && (item as Candidate<T>).kind === 'candidate';
}

/**
 * What the screen shows: the server's data (memory), plus the guesses whose real version
 * hasn't arrived yet.
 *
 * Memory is never edited. A candidate is dropped the moment memory contains an item with its
 * id; because the client generated that id, "has the server's version arrived?" is an exact
 * check, so the guess and the real thing never both show, and nothing flickers out and back.
 * Candidates come first: they're the newest things the user did.
 */
export function mergeWithCandidates<T>(
  memory: readonly T[],
  candidates: readonly Candidate<T>[],
  idOf: (item: T) => string,
): (T | Candidate<T>)[] {
  const known = new Set(memory.map(idOf));
  return [...candidates.filter((c) => !known.has(c.intentId)), ...memory];
}

/**
 * The intents ready to be retired (promoted): decided, and present in memory. Retiring is
 * still the caller's explicit act; this only says which ones are ready.
 */
export function readyToRetire<T>(
  doneIntentIds: readonly string[],
  memory: readonly T[],
  idOf: (item: T) => string,
): string[] {
  const known = new Set(memory.map(idOf));
  return doneIntentIds.filter((id) => known.has(id));
}
