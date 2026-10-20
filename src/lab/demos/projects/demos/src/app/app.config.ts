import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  provideRouter,
  withAutoCleanupInjectors,
  withComponentInputBinding,
} from '@angular/router';
import { routes } from './app.routes';
import { SomeSharedService } from './areas/shared/some-service';

export const appConfig: ApplicationConfig = {
  providers: [
    SomeSharedService,
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withAutoCleanupInjectors()),
  ],
};
