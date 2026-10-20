import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  provideRouter,
  withAutoCleanupInjectors,
  withComponentInputBinding,
  withRouterResources,
} from '@angular/router';
import { routes } from './app.routes';
import { SomeSharedService } from './areas/shared/some-service';

export const appConfig: ApplicationConfig = {
  providers: [
    SomeSharedService,
    provideBrowserGlobalErrorListeners(),
    // this makes it easy to create an input on a component with the same name as a route parameter
    // it is opt-in because you should be sure that's what you want
    provideRouter(
      routes,
      withComponentInputBinding(),
      withAutoCleanupInjectors(),
      withRouterResources(),
    ),
  ],
};
