import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-products',
    imports: [RouterOutlet],
    template: `
        <router-outlet />
    `,
    styles: ``
})
export class Home {

}