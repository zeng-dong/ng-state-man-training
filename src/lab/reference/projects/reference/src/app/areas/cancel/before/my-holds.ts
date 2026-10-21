import { Component, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { CancelDemoSetup } from '../demo-setup';
import { HoldsStore } from './holds-store';

@Component({
  selector: 'app-cancel-before-my-holds',
  imports: [CancelDemoSetup],
  providers: [HoldsStore],
  template: `
    <div class="flex flex-col gap-4 max-w-2xl">
      <h1 class="text-3xl font-bold">Your holds</h1>
      <app-cancel-demo-setup (ready)="store.load()" />

      <div class="h-4">
        @if (store.mutating()) {
          <progress class="progress progress-primary w-56"></progress>
        }
      </div>

      <dialog #loadingModal class="modal">
        <div class="modal-box flex items-center gap-4">
          <span class="loading loading-spinner loading-lg"></span>
          <h3 class="text-lg font-bold">{{ modalMessage() }}</h3>
        </div>
      </dialog>

      @if (store.errorLog().length > 0) {
        <div class="alert alert-error">
          <ul>
            @for (error of store.errorLog(); track $index) {
              <li>{{ error }}</li>
            }
          </ul>
        </div>
      }

      <table class="table table-zebra">
        <thead>
          <tr>
            <th>Title</th>
            <th>Pickup</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (hold of store.entities(); track hold.id) {
            <tr>
              <td>{{ hold.titleId }}</td>
              <td>{{ hold.branchCode }}</td>
              <td>{{ hold.status }}</td>
              <td>
                <button class="btn btn-sm btn-error" (click)="cancel(hold.id)">Cancel</button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class MyHolds {
  protected readonly store = inject(HoldsStore);

  private readonly modal = viewChild<ElementRef<HTMLDialogElement>>('loadingModal');
  protected readonly showModal = signal(false);
  protected readonly modalMessage = signal('Loading...');

  constructor() {
    effect(() => {
      const isLoading = this.store.loading();
      if (isLoading) {
        this.modalMessage.set('Loading your holds...');
        this.showModal.set(true);
        this.modal()?.nativeElement.showModal();
      } else {
        this.modalMessage.set('Loaded');
        this.showModal.set(false);
        this.modal()?.nativeElement.close();
      }
    });
  }

  protected cancel(id: string) {
    this.store.cancel(id);
  }
}
