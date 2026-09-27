import { Routes } from '@angular/router';

import { permissionGuard } from './core/auth.guard';
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
  { path: 'home', component: Home, canActivate: [permissionGuard('dashboard')] },
  { path: 'dashboard', component: Dashboard, canActivate: [permissionGuard('dashboard')] },
  { path: 'users', component: Users, canActivate: [permissionGuard('users')] },
  { path: 'upload', component: Upload, canActivate: [permissionGuard('upload')] },
  { path: 'etl', component: Etl, canActivate: [permissionGuard('etl')] },
  { path: 'records', component: Records, canActivate: [permissionGuard('records')] },
  { path: 'errors', component: Errors, canActivate: [permissionGuard('errors')] },
  { path: 'reports', component: Reports, canActivate: [permissionGuard('reports')] },
  { path: 'not-found', component: NotFound },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
