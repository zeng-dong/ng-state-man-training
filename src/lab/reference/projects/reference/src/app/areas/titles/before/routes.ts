import { Routes } from '@angular/router';
import { TitleDetail } from './title-detail';
import { TitleList } from './title-list';

export const beforeRoutes: Routes = [
  { path: '', component: TitleList },
  { path: ':titleId', component: TitleDetail },
];
