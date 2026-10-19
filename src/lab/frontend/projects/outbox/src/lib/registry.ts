import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';
import { IntentType } from './types';

/** Any registered intent type, whatever its payload and candidate. */
export type AnyIntentType = IntentType<unknown, unknown>;

export const INTENT_TYPES = new InjectionToken<AnyIntentType[]>('outbox intent types');

/**
 * Registers intent types with the outbox. Call it in the application's providers
 * (app.config), not a route's: an intent outlives the page that made it, so its
 * behavior has to be findable from anywhere, and (later) from a new session.
 */
export function provideIntentTypes(...types: AnyIntentType[]): EnvironmentProviders {
  return makeEnvironmentProviders(
    types.map((t) => ({ provide: INTENT_TYPES, useValue: t, multi: true })),
  );
}
