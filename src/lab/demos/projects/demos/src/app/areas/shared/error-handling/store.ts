import { signalStore } from '@ngrx/signals';
import { Events, on, withEventHandlers, withReducer } from '@ngrx/signals/events';
import { httpErrorEvents, MalFormedDataPayload } from './events';
import { withEntities, addEntities, addEntity, removeEntity } from '@ngrx/signals/entities';
import { inject } from '@angular/core';
import { map, mergeMap, tap } from 'rxjs';
import { LoggingApi } from './logging-api';
import { withStellarDevtools } from '@hypertheory-labs/stellar-ng-devtools';

type MalformedDataEntity = MalFormedDataPayload & { id: string };
export const ErrorStore = signalStore(
  withStellarDevtools('ErrorStore', {
    description: 'The Error handling store, with entities',
  }),
  withEntities<MalformedDataEntity>(),
  withReducer(
    on(httpErrorEvents.errorDismissed, ({ payload }) => removeEntity(payload)),
    on(httpErrorEvents.malformedData, (state) => {
      const newError: MalformedDataEntity = {
        ...state.payload,
        id: crypto.randomUUID(),
      };
      return addEntity(newError);
    }),
  ),
  // event handlers are like 'effects' in ngrx store
  withEventHandlers((store, events = inject(Events), service = inject(LoggingApi)) => ({
    sendMalformedDataToOtherApi$: events
      .on(httpErrorEvents.malformedData)
      .pipe(
        mergeMap((err) =>
          service
            .sendToLoggingEndPoint({ msg: err.payload.message, additional: err.payload.zodError })
            .pipe(tap((r) => console.log(`${r.trackingId} is the tracking id`))),
        ),
      ),
  })),
);
