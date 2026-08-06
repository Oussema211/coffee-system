import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { AdminLayoutComponent } from './pages/admin-dashboard/admin-layout';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard';
import { WorkerDashboardComponent } from './pages/worker-dashboard/worker-dashboard';
import { Menu } from './pages/menu/menu';
import { Orders } from './pages/orders/orders';
import { Workers } from './pages/workers/workers';
import { Reports } from './pages/reports/reports';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
      { path: '', component: AdminDashboardComponent },
      { path: 'menu', component: Menu },
      { path: 'orders', component: Orders },
      { path: 'workers', component: Workers },
      { path: 'reports', component: Reports },
    ]
  },
  { path: 'worker', component: WorkerDashboardComponent },
  { path: '**', redirectTo: 'login' }
];