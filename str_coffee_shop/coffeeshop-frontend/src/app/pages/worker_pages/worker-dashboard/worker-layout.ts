import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter, Subscription, interval } from 'rxjs';
import { AuthService } from '../../../core/auth.service';
import { OrderService } from '../../../core/order.service';
import { TableService } from '../../../core/table.service';
import { ShiftService, ShiftStatus } from '../../../core/shift.service';

interface NavItem {
  route: string;
  label: string;
  icon: string;
  badgeKey?: 'activeOrders' | 'qrPending';
  translationKey: string;
}

import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { LanguageSwitcherComponent } from '../../../core/components/language-switcher/language-switcher';
import { LoadingComponent } from '../../../core/components/loading/loading';
import { ConfirmDialogComponent } from '../../../core/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-worker-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule, TranslatePipe, LanguageSwitcherComponent, LoadingComponent, ConfirmDialogComponent],
  templateUrl: './worker-layout.html',
  styleUrl: './worker-layout.css'
})
export class WorkerLayoutComponent implements OnInit, OnDestroy {
  username: string | null;
  pageTitle = 'Dashboard';
  currentTime = '';
  badges = { activeOrders: 0, qrPending: 0 };
  shift: ShiftStatus = { checkedIn: false, checkInAt: null, checkOutAt: null };
  changingShift = false;
  showLogoutDialog = false;
  loggingOut = false;

  navItems: NavItem[] = [
    { route: '/worker', label: 'Home', icon: 'home', translationKey: 'nav.dashboard' },
    { route: '/worker/new-order', label: 'POS', icon: 'pos', translationKey: 'nav.pos' },
    { route: '/worker/active-orders', label: 'Orders', icon: 'orders', badgeKey: 'activeOrders', translationKey: 'nav.activeOrders' },
    { route: '/worker/qr-orders', label: 'QR', icon: 'qr', badgeKey: 'qrPending', translationKey: 'nav.qrOrders' },
    { route: '/worker/tables', label: 'Tables', icon: 'tables', translationKey: 'nav.tables' },
    { route: '/worker/menu', label: 'Menu', icon: 'menu', translationKey: 'nav.availability' },
  ];

  private readonly pageTitles: Record<string, string> = {
    '/worker': 'Dashboard',
    '/worker/new-order': 'New Order',
    '/worker/active-orders': 'Active Orders',
    '/worker/qr-orders': 'QR Orders',
    '/worker/tables': 'Tables',
    '/worker/menu': 'Menu Availability',
  };

  private subs = new Subscription();
  private clockInterval?: ReturnType<typeof setInterval>;

  constructor(
    private auth: AuthService,
    public router: Router,
    private orderService: OrderService,
    private tableService: TableService,
    private shiftService: ShiftService
  ) {
    this.username = this.auth.getUsername();
  }

  ngOnInit(): void {
    this.updatePageTitle(this.router.url);
    this.subs.add(
      this.router.events
        .pipe(filter(e => e instanceof NavigationEnd))
        .subscribe((e: NavigationEnd) => this.updatePageTitle(e.urlAfterRedirects))
    );

    this.tickClock();
    this.clockInterval = setInterval(() => this.tickClock(), 30_000);
    this.refreshBadges();
    this.refreshShift();
    this.subs.add(interval(20_000).subscribe(() => this.refreshBadges()));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (this.clockInterval) clearInterval(this.clockInterval);
  }

  isExactRoute(route: string): boolean {
    const url = this.router.url.split('?')[0];
    return route === '/worker' ? (url === '/worker' || url === '/worker/') : url.startsWith(route);
  }

  logout(): void {
    this.showLogoutDialog = true;
  }

  confirmLogout(): void {
    this.loggingOut = true;
    if (this.shift.checkedIn) {
      this.shiftService.checkOut().subscribe({
        next: () => this.finishLogout(),
        error: () => this.finishLogout()
      });
    } else {
      this.finishLogout();
    }
  }

  closeLogoutDialog(): void {
    if (this.loggingOut) return;
    this.showLogoutDialog = false;
  }

  private finishLogout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  toggleShift(): void {
    if (this.changingShift) return;
    this.changingShift = true;
    const request = this.shift.checkedIn ? this.shiftService.checkOut() : this.shiftService.checkIn();
    request.subscribe({
      next: (shift) => {
        this.shift = shift;
        this.changingShift = false;
      },
      error: () => this.changingShift = false
    });
  }

  private updatePageTitle(url: string): void {
    const path = url.split('?')[0];
    this.pageTitle = this.pageTitles[path] ?? 'Worker POS';
  }

  private tickClock(): void {
    this.currentTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private refreshBadges(): void {
    this.orderService.getAllOrders().subscribe({
      next: (orders) => {
        this.badges.activeOrders = orders.filter(
          o => o.status === 'Preparing' || o.status === 'Ready'
        ).length;
        this.badges.qrPending = orders.filter(
          o => o.type === 'QR' && o.status === 'Pending'
        ).length;
      },
      error: () => {}
    });
  }

  onNavClick(event: MouseEvent, route: string): void {
    if (!this.shift.checkedIn && route !== '/worker') {
      event.preventDefault();
    }
  }

  private refreshShift(): void {
    this.shiftService.refresh();
    this.subs.add(
      this.shiftService.shift$.subscribe((shift) => this.shift = shift)
    );
  }
}
