import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { isDevMode } from '@angular/core';

async function setupWorker() {
  if (isDevMode()) {
    const worker = (await import('./mocks/browser')).worker;

    return await worker.start({ quiet: true, onUnhandledRequest: 'bypass' });
  } else {
    return;
  }
}

await setupWorker().then(() =>
  bootstrapApplication(App, appConfig).catch((err) => console.error(err)),
);
