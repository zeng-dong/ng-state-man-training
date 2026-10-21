import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';

export class LoggingApi {
  readonly #client = inject(HttpClient);
  sendToLoggingEndPoint(err: { msg: string; additional?: any }) {
    return this.#client.post<{ trackingId: string }>(
      'https://logging.hypertheory-labs.dev/errors',
      err,
    );
  }
}
