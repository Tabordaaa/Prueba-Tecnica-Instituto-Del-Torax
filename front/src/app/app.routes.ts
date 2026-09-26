import { Routes } from '@angular/router';

import { authGuard } from './core/auth.guard';
import { Dashboard } from './pages/dashboard/dashboard';
import { Etl } from './pages/etl/etl';
import { Errors } from './pages/errors/errors';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Records } from './pages/records/records';
import { Reports } from './pages/reports/reports';
import { Upload } from './pages/upload/upload';
import { Users } from './pages/users/users';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'home', component: Home, canActivate: [authGuard] },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'users', component: Users, canActivate: [authGuard] },
  { path: 'upload', component: Upload, canActivate: [authGuard] },
  { path: 'etl', component: Etl, canActivate: [authGuard] },
  { path: 'records', component: Records, canActivate: [authGuard] },
  { path: 'errors', component: Errors, canActivate: [authGuard] },
  { path: 'reports', component: Reports, canActivate: [authGuard] },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
