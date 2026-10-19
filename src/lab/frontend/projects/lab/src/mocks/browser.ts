import { setupWorker } from 'msw/browser';
import { mockStore } from 'mock-control';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

// `?mock=flaky` (or any preset name) applies that scenario on load, so you can hand students a link.
const preset = new URLSearchParams(location.search).get('mock');
if (preset) mockStore.applyPreset(preset);
