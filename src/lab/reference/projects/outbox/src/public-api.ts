/*
 * Public API Surface of outbox
 */

export * from './lib/types';
export { outboxEvents } from './lib/events';
export { provideIntentTypes } from './lib/registry';
export type { AnyIntentType } from './lib/registry';
export { OutboxStore } from './lib/outbox-store';
export type { ApologyNotice, Receipt } from './lib/outbox-store';
export { isCandidate, mergeWithCandidates, readyToRetire } from './lib/promotion';
