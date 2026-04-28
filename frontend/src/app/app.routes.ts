import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { EmbeddedLayoutComponent } from './layouts/embedded-layout/embedded-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AccountsComponent } from './pages/accounts/accounts.component';
import { AccountDetailComponent } from './pages/account-detail/account-detail.component';
import { IframeHostComponent } from './pages/iframe-host/iframe-host.component';
import { CrossOriginIframeComponent } from './pages/cross-origin-iframe/cross-origin-iframe.component';
import { AccountSummaryComponent } from './components/account-summary/account-summary.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'accounts', component: AccountsComponent },
      { path: 'accounts/:id', component: AccountDetailComponent },
      { path: 'iframe-host', component: IframeHostComponent },
      { path: 'cross-origin-iframe', component: CrossOriginIframeComponent },
    ],
  },
  {
    path: 'embedded',
    component: EmbeddedLayoutComponent,
    children: [
      { path: 'account-summary', component: AccountSummaryComponent },
    ],
  },
];
