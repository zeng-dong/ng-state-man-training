import { defineIntentType } from 'outbox';
import { API_URL, CURRENT_PATRON_ID, Hold } from '../after/api';

/** What the user asked for: plain data, so it could be stored and resumed later. */
export interface PlaceHoldPayload {
  titleId: number;
  titleName: string;
  branchCode: string;
}

/**
 * Everything the outbox needs to know about placing a hold. Registered once, app-wide
 * (app.config), because an intent outlives the page that made it.
 */
export const placeHold = defineIntentType<PlaceHoldPayload, Hold>({
  name: 'place-hold',

  // The intent's own id is the hold's id: a create that is idempotent and verifiable.
  request: ({ id, payload }) => ({
    method: 'PUT',
    url: `${API_URL}/holds/${id}`,
    body: { patronId: CURRENT_PATRON_ID, titleId: payload.titleId, branchCode: payload.branchCode },
  }),

  // Always true, from the moment of the click.
  receipt: ({ payload }) =>
    `We've received your request to place a hold on ${payload.titleName} at ${payload.branchCode}.`,

  // The guess: the row it will be if it works. Shown as a guess, never as a fact.
  candidate: ({ id, payload }) => ({
    id,
    titleId: payload.titleId,
    branchCode: payload.branchCode,
    status: 'requested',
    reason: null,
  }),

  // Declared with the guess, not invented when it fails.
  apology: {
    say: ({ payload }, failure) => {
      switch (failure.kind) {
        case 'timeout':
          return `We're not sure your request for ${payload.titleName} went through. Check your holds before trying again.`;
        case 'network':
          return `We couldn't reach the library to request ${payload.titleName}.`;
        case 'rejected':
          return `We couldn't place your hold on ${payload.titleName}: ${failure.detail ?? 'the library said no.'}`;
      }
    },
    actions: ['retry'],
  },

  timeoutMs: 10_000,
});
