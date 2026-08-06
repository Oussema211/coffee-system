import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard';
import { WorkerDashboardComponent } from './pages/worker-dashboard/worker-dashboard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'admin', component: AdminDashboardComponent },
  { path: 'worker', component: WorkerDashboardComponent },
  { path: '**', redirectTo: 'login' }
];