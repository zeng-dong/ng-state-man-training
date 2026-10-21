import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  provideRouter,
  withAutoCleanupInjectors,
  withComponentInputBinding,
  withRouterResources,
} from '@angular/router';
import { routes } from './app.routes';
import { SomeSharedService } from './areas/shared/some-service';
import { ErrorStore } from './areas/shared/error-handling/store';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { httpErrorInterceptor } from './areas/shared/error-handling/http-error-interceptor';
import { LoggingApi } from './areas/shared/error-handling/logging-api';
import { provideStellar } from '@hypertheory-labs/stellar-ng-devtools';
export const appConfig: ApplicationConfig = {
  providers: [
    provideStellar(),
    LoggingApi,
    provideHttpClient(withInterceptors([httpErrorInterceptor])),
    ErrorStore,
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
