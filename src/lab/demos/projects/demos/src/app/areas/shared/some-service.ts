import { HttpClient } from '@angular/common/http';
import { inject, Injectable, Service } from '@angular/core';

// WTH?? in the old days, if you had a service that had a constructor with
// dependencies you wanted to inject, you had to use @Injectable()
// the providedIn: 'root' means - UNLESS there is a provider, automatically provide this.
// The angular documentation says this will create a "singleton" - that is a lie.
// It does not. You can have multiple instances.
// this just means you don't have to provide it.
// if you do, then it will create other instances.
// @Injectable({ providedIn: 'root' })
// export class SomeSharedService {
//   #client = inject(HttpClient);

//   constructor() {
//     console.log('Created an instance of teh shared service');
//   }
// }

// @Service()
// export class SomeSharedService {
//   #client = inject(HttpClient);
// }

export class SomeSharedService {
  #client = inject(HttpClient);
  constructor() {
    console.log('Created an instance of teh shared service');
  }
}
