import { Routes } from '@angular/router';

import { authGuard } from './core/auth.guard';
import { viewGuard } from './core/view-permission.guard';
import { Dashboard } from './pages/dashboard/dashboard';
import { Etl } from './pages/etl/etl';
import { Errors } from './pages/errors/errors';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { NotFound } from './pages/not-found/not-found';
import { Records } from './pages/records/records';
import { Reports } from './pages/reports/reports';
import { Upload } from './pages/upload/upload';
import { Users } from './pages/users/users';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'home', component: Home, canActivate: [authGuard] },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard, viewGuard('dashboard')] },
  { path: 'users', component: Users, canActivate: [authGuard, viewGuard('users')] },
  { path: 'upload', component: Upload, canActivate: [authGuard, viewGuard('upload')] },
  { path: 'etl', component: Etl, canActivate: [authGuard, viewGuard('etl')] },
  { path: 'records', component: Records, canActivate: [authGuard, viewGuard('records')] },
  { path: 'errors', component: Errors, canActivate: [authGuard, viewGuard('errors')] },
  { path: 'reports', component: Reports, canActivate: [authGuard, viewGuard('reports')] },
  { path: 'not-found', component: NotFound },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
