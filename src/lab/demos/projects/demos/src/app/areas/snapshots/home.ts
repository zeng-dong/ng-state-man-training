import { Component } from '@angular/core';
import { SectionHomeNav } from '../shared/widgets/section-home-nav';

@Component({
  selector: 'app-snapshots-home',
  imports: [SectionHomeNav],
  template: ` <app-shared-section-home-nav [links]="links" /> `,
  styles: ``,
})
export class Home {
  links = [
    { title: 'Without Snapshots', path: 'without' },
    { title: 'With Snapshots', path: 'with' },
  ];
}
