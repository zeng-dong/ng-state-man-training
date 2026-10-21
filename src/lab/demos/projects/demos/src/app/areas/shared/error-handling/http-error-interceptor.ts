// This will see EVERY http request (and response) in the application
// if there is an error, it will dispatch an event

import { HttpEventType, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { tap } from 'rxjs';

export function httpErrorInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  console.log(`Got a request to ${req.url} and it is a ${req.method} method`);
  return next(req).pipe(
    tap((event) => {
      if (event.type === HttpEventType.Response && event.status > 299) {
        console.log(`Got a response ${event.status}`);
      }
    }),
  );
}
