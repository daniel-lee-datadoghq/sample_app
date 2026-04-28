import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Account, Transaction } from '../models/account.model';

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

  constructor(private http: HttpClient) {}

  getAccounts(): Observable<Account[]> {
    return this.http.get<Account[]>(`${this.baseUrl}/accounts`);
  }

  getAccountById(id: number): Observable<Account> {
    return this.http.get<Account>(`${this.baseUrl}/accounts/${id}`);
  }

  createAccount(request: CreateAccountRequest): Observable<Account> {
    return this.http.post<Account>(`${this.baseUrl}/accounts`, request);
  }

  updateAccount(id: number, request: Partial<CreateAccountRequest>): Observable<Account> {
    return this.http.put<Account>(`${this.baseUrl}/accounts/${id}`, request);
  }

  deleteAccount(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/accounts/${id}`);
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
    return this.http.post<Transaction>(`${this.baseUrl}/transactions`, request);
  }

  deleteTransaction(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/transactions/${id}`);
  }
}
