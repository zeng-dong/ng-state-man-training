import { HttpClient } from '@angular/common/http';
import { Component, inject, output, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_URL, CURRENT_PATRON_ID, Hold } from '../holds/after/api';

/**
 * Demo setup, not part of the lesson: start over, then place three holds, one at a time.
 */
@Component({
  selector: 'app-cancel-demo-setup',
  template: `
    <div class="flex items-center gap-3 text-sm">
      <button class="btn btn-sm btn-outline" [disabled]="busy()" (click)="setUp()">
        Set up the demo
      </button>
      <span role="status">{{ progress() }}</span>
    </div>
  `,
})
export class CancelDemoSetup {
  private readonly http = inject(HttpClient);
  protected readonly busy = signal(false);
  protected readonly progress = signal('');
  readonly ready = output<void>();

  protected async setUp() {
    this.busy.set(true);
    try {
      this.progress.set('Resetting the API…');
      await firstValueFrom(this.http.post(`${API_URL}/dev/reset`, null));
      this.ready.emit();

      // Three is the limit, so all three are placed; no need to wait between them.
      this.progress.set('Placing three holds and waiting for the decisions…');
      await Promise.all(
        [1001, 1003, 1004].map(async (titleId) => {
          const id = crypto.randomUUID();
          await firstValueFrom(
            this.http.put(`${API_URL}/holds/${id}`, {
              patronId: CURRENT_PATRON_ID,
              titleId,
              branchCode: 'CEN',
            }),
          );
          await this.decided(id);
        }),
      );
      this.ready.emit();
      this.progress.set('Ready: three holds, all placed.');
    } catch {
      this.progress.set('Setup failed. Is the API running in Development (dotnet run)?');
    } finally {
      this.busy.set(false);
    }
  }

  private async decided(id: string) {
    for (let i = 0; i < 40; i++) {
      const hold = await firstValueFrom(this.http.get<Hold>(`${API_URL}/holds/${id}`));
      if (hold.status !== 'requested') return;
      await new Promise((r) => setTimeout(r, 500));
    }
  }
}
