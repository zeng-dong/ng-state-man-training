import { isCandidate, mergeWithCandidates, readyToRetire } from './promotion';
import { Candidate } from './types';

interface Hold {
  id: string;
  status: string;
}

const memory: Hold[] = [
  { id: 'a', status: 'placed' },
  { id: 'b', status: 'requested' },
];
const guess = (id: string): Candidate<Hold> => ({
  kind: 'candidate',
  intentId: id,
  value: { id, status: 'requested' },
});

describe('promotion', () => {
  it('shows a guess until its real version arrives, newest first', () => {
    const merged = mergeWithCandidates(memory, [guess('c')], (h) => h.id);
    expect(merged.map((m) => (isCandidate(m) ? `guess:${m.intentId}` : m.id))).toEqual([
      'guess:c',
      'a',
      'b',
    ]);
  });

  it('drops a guess the moment memory has its id (never both, never neither)', () => {
    const merged = mergeWithCandidates(memory, [guess('b')], (h) => h.id);
    expect(merged.filter(isCandidate)).toEqual([]);
    expect(merged).toEqual(memory);
  });

  it('never edits memory', () => {
    const before = structuredClone(memory);
    mergeWithCandidates(memory, [guess('c')], (h) => h.id);
    expect(memory).toEqual(before);
  });

  it('a decided intent is ready to retire only once memory contains it', () => {
    expect(readyToRetire(['b', 'c'], memory, (h) => h.id)).toEqual(['b']);
  });
});
