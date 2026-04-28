import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CurrencyPipe, TitleCasePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AccountApiService } from '../../services/account-api.service';
import { Account } from '../../models/account.model';
import { getAccountIcon } from '../../utils/account-utils';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type SortMode = 'default' | 'balance-asc' | 'balance-desc' | 'name-asc';
type FilterType = 'all' | 'checking' | 'savings' | 'credit';

@Component({
  selector: 'app-account-summary',
  standalone: true,
  imports: [
    CurrencyPipe,
    TitleCasePipe,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatTooltipModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
  ],
  templateUrl: './account-summary.component.html',
  styleUrl: './account-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountSummaryComponent implements OnInit {
  accounts: Account[] = [];
  displayedAccounts: Account[] = [];
  totalBalance = 0;
  loading = true;

  sortMode: SortMode = 'default';
  activeFilter: FilterType = 'all';
  filterOptions: FilterType[] = ['all', 'checking', 'savings', 'credit'];

  private destroyRef = inject(DestroyRef);

  constructor(private api: AccountApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  setFilter(filter: FilterType): void {
    this.activeFilter = filter;
    this.applyFilterAndSort();
  }

  cycleSortMode(): void {
    const modes: SortMode[] = ['default', 'balance-desc', 'balance-asc', 'name-asc'];
    const currentIndex = modes.indexOf(this.sortMode);
    this.sortMode = modes[(currentIndex + 1) % modes.length];
    this.applyFilterAndSort();
  }

  getSortIcon(): string {
    switch (this.sortMode) {
      case 'balance-desc': return 'arrow_downward';
      case 'balance-asc': return 'arrow_upward';
      case 'name-asc': return 'sort_by_alpha';
      default: return 'swap_vert';
    }
  }

  getSortLabel(): string {
    switch (this.sortMode) {
      case 'balance-desc': return 'Balance: High to Low';
      case 'balance-asc': return 'Balance: Low to High';
      case 'name-asc': return 'Name: A to Z';
      default: return 'Default Order';
    }
  }

  private applyFilterAndSort(): void {
    let result = this.activeFilter === 'all'
      ? [...this.accounts]
      : this.accounts.filter(a => a.type === this.activeFilter);

    switch (this.sortMode) {
      case 'balance-desc':
        result.sort((a, b) => b.balance - a.balance);
        break;
      case 'balance-asc':
        result.sort((a, b) => a.balance - b.balance);
        break;
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    this.displayedAccounts = result;
    this.totalBalance = result.reduce((sum, a) => sum + a.balance, 0);
    this.cdr.markForCheck();
  }

  private loadAccounts(): void {
    this.api.getAccounts().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: accounts => {
        this.accounts = accounts;
        this.loading = false;
        this.applyFilterAndSort();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  getAccountIcon = getAccountIcon;
}
