import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideStellar, withHttpTrafficMonitoring } from '@hypertheory-labs/stellar-ng-devtools';
import {
  provideRouter,
  withComponentInputBinding,
  withRouterConfig,
  withRouterResources,
} from '@angular/router';
import { provideIntentTypes } from 'outbox';
import { placeHold } from './areas/holds/outbox/place-hold-intent';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withRouterResources(),
      // child routes see their parent's params (e.g. :titleId)
      withRouterConfig({ paramsInheritanceStrategy: 'always' }),
    ),
    // the outbox's intent types: app-wide, because an intent outlives the page that made it
    provideIntentTypes(placeHold),
    // Stellar DevTools doesn't switch itself off in production builds: development only
    ...(isDevMode() ? [provideStellar(withHttpTrafficMonitoring())] : []),
  ],
};
