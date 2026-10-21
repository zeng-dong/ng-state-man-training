import { computed } from '@angular/core';
import { Data } from '@angular/router';
import { withStellarDevtools } from '@hypertheory-labs/stellar-ng-devtools';
import {
  patchState,
  signalStore,
  watchState,
  withComputed,
  withHooks,
  withLinkedState,
  withMethods,
  withState,
} from '@ngrx/signals';
/*
    withState:
        current: number
      
        byValues: number[]
    withLinkedState:
        setCountBy
    withMethods: 
        set byValues(number[])
        increment()
        decrement()
    withComputed: 
        isEven
    efft:
        // ??
*/

type DataModel = {
  current: number;
  by: number;
};
export const CounterStore = signalStore(
  withStellarDevtools('CounterStore', {
    description: 'This is for a counter demo using signal store',
    sourceHint: `projects/demos/src/app/areas/signals/stores/counter.ts`,
  }),
  withState({
    current: 0,
    byValues: [1, 3, 5],
  }),
  withLinkedState((state) => ({
    countBy: () => state.byValues()[0],
  })),
  withMethods((state) => ({
    increment: () => patchState(state, { current: state.current() + state.countBy() }),
    decrement: () => patchState(state, { current: state.current() - state.countBy() }),
    setCountBy: (value: number) => patchState(state, { countBy: value }),
  })),
  withComputed((state) => ({
    isEven: computed(() => state.current() % 2 === 0),
  })),
  withHooks({
    onInit(store) {
      // read the data from localstorage
      const savedJson = localStorage.getItem('counter-data');
      if (savedJson !== null) {
        const state = JSON.parse(savedJson) as DataModel; // trust me bro.
        patchState(store, { current: state.current, countBy: state.by });
      }

      // broadcast channel - no middle-man, no having to write to localstorage, etc.
      //   const bc = new BroadcastChannel('current-changed');
      //   bc.onmessage = (evt) => {
      //     console.log(evt);
      //     // const d = evt as unknown as { current: number };
      //     // console.log('got a new value', d.current);
      //     //patchState(store, { current: d.current });
      //   };
      window.addEventListener('storage', () => {
        console.log('Go and get the data');
        const savedJson = localStorage.getItem('counter-data');
        if (savedJson !== null) {
          const state = JSON.parse(savedJson) as DataModel; // trust me bro.
          patchState(store, { current: state.current, countBy: state.by });
        }
      });
      watchState(store, (state) => {
        console.log(state); // no getting the value from the signals

        const modelToSave: DataModel = {
          by: state.countBy,
          current: state.current,
        };
        localStorage.setItem('counter-data', JSON.stringify(modelToSave));
      });
      // have a watchState = write it to the localstorage
    },
  }),
);
