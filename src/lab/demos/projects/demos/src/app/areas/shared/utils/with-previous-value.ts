import { linkedSignal, Resource, resourceFromSnapshots, ResourceSnapshot } from '@angular/core';

export function withPreviousValue<T>(input: Resource<T>): Resource<T> {
  const derived = linkedSignal<ResourceSnapshot<T>, ResourceSnapshot<T>>({
    source: input.snapshot,
    computation: (snap, previous) => {
      if (snap.status === 'loading' && previous && previous.value.status !== 'error') {
        return { status: 'loading' as const, value: previous?.value.value };
      }
      return snap;
    },
  });
  return resourceFromSnapshots(derived);
}
