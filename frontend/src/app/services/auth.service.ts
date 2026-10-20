import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { datadogRum } from '@datadog/browser-rum';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  id: number;
  token: string;
  name: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

type UserType = 'high_net_worth' | 'low_net_worth';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const HIGH_NET_WORTH_THRESHOLD = 100_000;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = '/api/auth';

  private readonly currentUser = signal<AuthUser | null>(this.loadUser());
  private readonly currentUserType = signal<UserType>('low_net_worth');
  private readonly currentRoles = signal<string[]>([]);

  readonly user = this.currentUser.asReadonly();
  readonly roles = this.currentRoles.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUser() !== null);

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {
    if (this.currentUser()) {
      this.applyRumUser();
    }
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, request).pipe(
      tap((response) => this.handleAuthResponse(response)),
    );
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, request).pipe(
      tap((response) => this.handleAuthResponse(response)),
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
    this.currentRoles.set([]);
    this.currentUserType.set('low_net_worth');
    datadogRum.clearUser();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  updateUserType(totalBalance: number): void {
    this.currentUserType.set(
      totalBalance >= HIGH_NET_WORTH_THRESHOLD ? 'high_net_worth' : 'low_net_worth',
    );
    this.applyRumUser();
  }

  /** Called once the server has resolved this user's entitlement roles. */
  setRoles(roles: string[]): void {
    this.currentRoles.set(roles);
    this.applyRumUser();
  }

  /**
   * `setUser` replaces the whole user object, so every attribute is re-sent together. Setting
   * them piecemeal would let a later call drop the roles or the user type.
   */
  private applyRumUser(): void {
    const user = this.currentUser();
    if (!user) return;
    const roles = this.currentRoles();
    datadogRum.setUser({
      id: String(user.id),
      name: user.name,
      email: user.email,
      user_type: this.currentUserType(),
      ...(roles.length ? { roles: roles.join(',') } : {}),
    });
  }

  private handleAuthResponse(response: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, response.token);
    const user: AuthUser = { id: response.id, name: response.name, email: response.email };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
    this.currentRoles.set([]);
    this.currentUserType.set('low_net_worth');
    this.applyRumUser();
  }

  private loadUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }
}
