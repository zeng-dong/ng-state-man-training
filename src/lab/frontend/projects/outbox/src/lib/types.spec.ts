import { Candidate, defineIntentType, Intent } from './types';

// What an app would write: the "place a hold" intent from the library lab.
interface PlaceHold {
  titleId: number;
  title: string;
  branchCode: string;
}

interface Hold {
  id: string;
  titleId: number;
  title: string;
  branchCode: string;
}

const placeHold = defineIntentType<PlaceHold, Hold>({
  name: 'place-hold',
  // PUT to the intent's id: a create that is idempotent and verifiable
  request: (intent) => ({
    method: 'PUT',
    url: `https://circulation.hypertheory-labs.dev/holds/${intent.id}`,
    body: intent.payload,
  }),
  receipt: ({ payload }) => `We've received your request to place a hold on ${payload.title}.`,
  candidate: ({ id, payload }) => ({ id, ...payload }),
  apology: {
    say: ({ payload }, failure) =>
      failure.kind === 'timeout'
        ? `We're not sure your hold on ${payload.title} went through. Check your holds before trying again.`
        : `We couldn't place a hold on ${payload.title}.`,
    actions: ['retry', 'edit'],
  },
  timeoutMs: 10_000,
});

const intent: Intent<PlaceHold> = {
  id: 'b3c1a7e2-0000-4000-8000-000000000001',
  type: placeHold.name,
  payload: { titleId: 1001, title: 'Dune', branchCode: 'NOR' },
  requestedAt: Date.UTC(2026, 9, 14, 15, 0),
  state: { status: 'unknown', sentAt: Date.UTC(2026, 9, 14, 15, 0, 1) },
  schema: 1,
};

describe('outbox types', () => {
  it('an intent is plain data: it survives a JSON round trip unchanged', () => {
    expect(JSON.parse(JSON.stringify(intent))).toEqual(intent);
  });

  it('behavior lives on the intent type, found by name', () => {
    expect(intent.type).toBe('place-hold');
    expect(placeHold.receipt(intent)).toBe("We've received your request to place a hold on Dune.");
  });

  it('the apology can tell a timeout (maybe it landed) from a rejection', () => {
    expect(placeHold.apology.say(intent, { kind: 'timeout' })).toContain("We're not sure");
    expect(placeHold.apology.say(intent, { kind: 'rejected', status: 409 })).toBe(
      "We couldn't place a hold on Dune.",
    );
  });

  it("a candidate is wrapped, so it can't be mistaken for a Hold", () => {
    const guess: Candidate<Hold> = {
      kind: 'candidate',
      intentId: intent.id,
      value: placeHold.candidate!(intent),
    };
    expect(guess.value.id).toBe(intent.id); // the real hold will have this id
  });
});
