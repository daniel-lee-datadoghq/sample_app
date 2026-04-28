import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AccountApiService } from '../../services/account-api.service';
import { AuthService } from '../../services/auth.service';
import { Transaction } from '../../models/account.model';
import { TransactionDialogComponent } from '../../components/transaction-dialog/transaction-dialog.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, MatCardModule, MatIconModule, MatTableModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  totalBalance = 0;
  accountCount = 0;
  recentTransactions: Transaction[] = [];
  displayedColumns = ['date', 'description', 'amount'];
  loading = true;

  private destroyRef = inject(DestroyRef);

  constructor(
    private api: AccountApiService,
    private auth: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.cdr.markForCheck();
    forkJoin({
      summary: this.api.getAccountSummary(),
      transactions: this.api.getRecentTransactions(20),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ({ summary, transactions }) => {
        this.totalBalance = summary.totalBalance;
        this.accountCount = summary.accountCount;
        this.recentTransactions = transactions;
        this.loading = false;
        this.auth.updateUserType(summary.totalBalance);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  addTransaction(): void {
    const ref = this.dialog.open(TransactionDialogComponent, { data: {} });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.api.createTransaction(result).subscribe(() => {
          this.snackBar.open('Transaction added', 'Close', { duration: 3000 });
          this.loadData();
        });
      }
    });
  }
}
