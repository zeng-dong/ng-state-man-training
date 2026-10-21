import { type } from '@ngrx/signals';

import { eventGroup } from '@ngrx/signals/events';
export type MalFormedDataPayload = { message: string; zodError: unknown; featureName?: string };

export const httpErrorEvents = eventGroup({
  source: 'Application Http Errors',
  events: {
    malformedData: type<MalFormedDataPayload>(),
    httpError: type<{ url: string; status: number }>(),
    errorDismissed: type<string>(),
  },
});
