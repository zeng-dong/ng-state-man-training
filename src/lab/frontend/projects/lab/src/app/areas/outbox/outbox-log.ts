import { Component, inject, Service, signal } from '@angular/core';
import { Events } from '@ngrx/signals/events';
import { Intent, outboxEvents } from 'outbox';

export interface LogEntry {
  readonly seq: number;
  readonly intentId: string;
  /** Seconds since the user clicked (the intent's requestedAt). */
  readonly elapsed: number;
  /** Who's speaking: the outbox (its events), or the page (what it asked or was told). */
  readonly source: 'outbox' | 'page';
  readonly text: string;
}

const KEEP = 40;

/**
 * Provided for Lab 3; you don't need to change it. Put `<app-outbox-log />` on your page once
 * it uses the outbox, and it shows each step of each intent, timed from the click.
 *
 * It's just one more listener on the outbox's events (the outbox doesn't know it exists).
 * `note(intentId, text)` adds the page's side: what it asked, or what it was told.
 */
@Service()
export class OutboxLog {
  private readonly started = new Map<string, number>();
  private seq = 0;
  readonly entries = signal<LogEntry[]>([]);

  constructor() {
    const e = outboxEvents;
    const say = (event: { intent: Intent }, text: string) => this.add(event.intent, 'outbox', text);
    const events = inject(Events);
    events
      .on(e.intentRequested)
      .subscribe(({ payload }) => say(payload, 'requested: held locally'));
    events.on(e.intentSent).subscribe(({ payload }) => say(payload, 'sent'));
    events
      .on(e.intentReceived)
      .subscribe(({ payload }) => say(payload, 'received (202): the server has it; not done'));
    events.on(e.intentDone).subscribe(({ payload }) => say(payload, 'done'));
    events
      .on(e.intentUnknown)
      .subscribe(({ payload }) => say(payload, 'unknown: no answer in time (still listening)'));
    events.on(e.intentNeedsAttention).subscribe(({ payload }) => {
      const s = payload.intent.state;
      say(
        payload,
        `needs attention${s.status === 'needs-attention' && s.failure.detail ? `: ${s.failure.detail}` : ''}`,
      );
    });
    events.on(e.intentFailedToSend).subscribe(({ payload }) => say(payload, 'failed to send'));
    events
      .on(e.intentRetired)
      .subscribe(({ payload }) =>
        say(payload, "retired: the server's row is in memory, the guess is gone"),
      );
    events.on(e.intentDismissed).subscribe(({ payload }) => say(payload, 'dismissed'));
  }

  /** The page's side of the story: what it asked, or what it was told, and why. */
  note(intentId: string, text: string) {
    const start = this.started.get(intentId);
    if (start === undefined) return; // not an intent this log saw begin
    this.push(intentId, start, 'page', text);
  }

  clear() {
    this.entries.set([]);
  }

  private add(intent: Intent, source: LogEntry['source'], text: string) {
    if (!this.started.has(intent.id)) this.started.set(intent.id, intent.requestedAt);
    this.push(intent.id, this.started.get(intent.id)!, source, text);
  }

  private push(intentId: string, start: number, source: LogEntry['source'], text: string) {
    const entry = { seq: this.seq++, intentId, elapsed: (Date.now() - start) / 1000, source, text };
    this.entries.update((all) => [...all, entry].slice(-KEEP));
  }
}

@Component({
  selector: 'app-outbox-log',
  template: `
    <section class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold">What just happened</h2>
        <button class="btn btn-xs btn-ghost" (click)="log.clear()">Clear</button>
      </div>
      <ol role="log" class="font-mono text-sm bg-base-200 rounded-box p-3 min-h-16">
        @for (entry of log.entries(); track entry.seq) {
          <li class="flex gap-3">
            <span class="w-16 shrink-0 text-right tabular-nums"
              >+{{ entry.elapsed.toFixed(1) }}s</span
            >
            <span class="w-20 shrink-0 opacity-70">{{ entry.intentId.slice(0, 8) }}</span>
            <span class="w-14 shrink-0" [class.font-bold]="entry.source === 'page'">{{
              entry.source
            }}</span>
            <span>{{ entry.text }}</span>
          </li>
        } @empty {
          <li class="opacity-70">Nothing yet. Place a hold.</li>
        }
      </ol>
    </section>
  `,
})
export class OutboxLogView {
  protected readonly log = inject(OutboxLog);
}
