import { Routes } from '@angular/router';
import { LoginComponent } from './pages/auth_pages/login/login';

import { AdminLayoutComponent } from './pages/admin_pages/admin-dashboard/admin-layout';
import { AdminDashboardComponent } from './pages/admin_pages/admin-dashboard/admin-dashboard';
import { Menu } from './pages/admin_pages/menu/menu';
import { Orders } from './pages/admin_pages/orders/orders';
import { Workers } from './pages/admin_pages/workers/workers';
import { Reports } from './pages/admin_pages/reports/reports';
import { Categories } from './pages/admin_pages/categories/categories';

import { WorkerLayoutComponent } from './pages/worker_pages/worker-dashboard/worker-layout';
import { WorkerDashboardComponent } from './pages/worker_pages/worker-dashboard/worker-dashboard';
import { ActiveOrdersComponent } from './pages/worker_pages/active-orders/active-orders';
import { NewOrderComponent } from './pages/worker_pages/new-order/new-order';
import { QrOrdersComponent } from './pages/worker_pages/qr-orders/qr-orders';
import { TablesComponent } from './pages/worker_pages/tables/tables';

import { authGuard } from './core/auth.guard';
import { roleGuard } from './core/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, roleGuard('ADMIN')],
    children: [
      { path: '', component: AdminDashboardComponent },
      { path: 'menu', component: Menu },
      { path: 'orders', component: Orders },
      { path: 'workers', component: Workers },
      { path: 'reports', component: Reports },
      { path: 'categories', component: Categories },
    ]
  },
  {
    path: 'worker',
    component: WorkerLayoutComponent,
    canActivate: [authGuard, roleGuard('WORKER')],
    children: [
      { path: '', component: WorkerDashboardComponent },
      { path: 'active-orders', component: ActiveOrdersComponent },
      { path: 'new-order', component: NewOrderComponent },
      { path: 'qr-orders', component: QrOrdersComponent },
      { path: 'tables', component: TablesComponent },
    ]
  },
  { path: '**', redirectTo: 'login' }
];