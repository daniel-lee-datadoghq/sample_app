import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Account, Transaction } from '../models/account.model';
import { OrderResult, PlaceOrderRequest, Position } from '../models/trade.model';

export interface CreateAccountRequest {
  name: string;
  type: Account['type'];
  accountNumber: string;
  balance: number;
  currency: string;
}

export interface CreateTransactionRequest {
  accountId: number;
  description: string;
  amount: number;
  type: Transaction['type'];
}

export interface AccountSummary {
  totalBalance: number;
  accountCount: number;
}

@Injectable({ providedIn: 'root' })
export class AccountApiService {
  private readonly baseUrl = '/api';

  private readonly mutations = signal(0);

  /**
   * Bumped by every write. Pages watch it so an order placed from the trade overlay is
   * reflected on the page underneath without a route change or manual refresh.
   */
  readonly dataVersion = this.mutations.asReadonly();

  constructor(private http: HttpClient) {}

  getAccounts(): Observable<Account[]> {
    return this.http.get<Account[]>(`${this.baseUrl}/accounts`);
  }

  getAccountById(id: number): Observable<Account> {
    return this.http.get<Account>(`${this.baseUrl}/accounts/${id}`);
  }

  createAccount(request: CreateAccountRequest): Observable<Account> {
    return this.http.post<Account>(`${this.baseUrl}/accounts`, request).pipe(this.trackMutation());
  }

  updateAccount(id: number, request: Partial<CreateAccountRequest>): Observable<Account> {
    return this.http.put<Account>(`${this.baseUrl}/accounts/${id}`, request).pipe(this.trackMutation());
  }

  deleteAccount(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/accounts/${id}`).pipe(this.trackMutation());
  }

  getAccountSummary(): Observable<AccountSummary> {
    return this.http.get<AccountSummary>(`${this.baseUrl}/accounts/summary`);
  }

  getRecentTransactions(limit: number = 10): Observable<Transaction[]> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<Transaction[]>(`${this.baseUrl}/transactions`, { params });
  }

  getTransactionsByAccount(accountId: number): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.baseUrl}/transactions/account/${accountId}`);
  }

  createTransaction(request: CreateTransactionRequest): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.baseUrl}/transactions`, request).pipe(this.trackMutation());
  }

  getPositions(): Observable<Position[]> {
    return this.http.get<Position[]>(`${this.baseUrl}/positions`);
  }

  /** Settles an equity order: moves cash, records the transaction and updates the holding. */
  placeOrder(request: PlaceOrderRequest): Observable<OrderResult> {
    return this.http.post<OrderResult>(`${this.baseUrl}/orders`, request).pipe(this.trackMutation());
  }

  /** Signals watchers that server-side account data changed. */
  private trackMutation<T>() {
    return tap<T>(() => this.mutations.update((version) => version + 1));
  }

  deleteTransaction(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/transactions/${id}`).pipe(this.trackMutation());
  }
}
