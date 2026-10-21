import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import {
  patchState,
  signalStore,
  watchState,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { removeEntity, setAllEntities, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, mergeMap, pipe, switchMap, tap } from 'rxjs';
import { API_URL, CURRENT_PATRON_ID, Hold } from '../../holds/after/api';

export const HoldsStore = signalStore(
  withEntities<Hold>(),
  withState({
    loading: true,
    mutating: false,
    errorLog: [] as string[],
    requiresReload: false,
  }),
  withMethods((store) => {
    const http = inject(HttpClient);
    return {
      cancel: rxMethod<string>(
        pipe(
          tap((id) => patchState(store, { mutating: true }, removeEntity(id))),
          mergeMap((id) =>
            http.delete(`${API_URL}/holds/${id}`).pipe(
              tap(() => patchState(store, { mutating: false })),
              catchError((err: HttpErrorResponse) => {
                patchState(store, {
                  errorLog: [
                    ...store.errorLog(),
                    `Could not cancel ${id}: ${err.statusText} (${err.status})`,
                  ],
                  mutating: false,
                  requiresReload: true,
                });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),
      load: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap(() =>
            http.get<Hold[]>(`${API_URL}/holds`, { params: { patronId: CURRENT_PATRON_ID } }).pipe(
              tap((holds) =>
                patchState(store, setAllEntities(holds), {
                  loading: false,
                  errorLog: [],
                  requiresReload: false,
                }),
              ),
              catchError((err) => {
                console.log(err);
                return EMPTY;
              }),
            ),
          ),
        ),
      ),
    };
  }),
  withHooks({
    onInit(store) {
      store.load();
      watchState(store, (state) => {
        if (state.requiresReload) {
          patchState(store, { requiresReload: false });
          store.load();
        }
      });
    },
  }),
);
