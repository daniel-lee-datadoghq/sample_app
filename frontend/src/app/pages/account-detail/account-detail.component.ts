import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Account, Transaction } from '../../models/account.model';
import { AccountApiService } from '../../services/account-api.service';
import { TransactionDialogComponent } from '../../components/transaction-dialog/transaction-dialog.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { getAccountIcon } from '../../utils/account-utils';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, map, forkJoin } from 'rxjs';

@Component({
  selector: 'app-account-detail',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, TitleCasePipe, MatCardModule, MatTableModule, MatIconModule, MatButtonModule, MatChipsModule, MatProgressSpinnerModule],
  templateUrl: './account-detail.component.html',
  styleUrl: './account-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountDetailComponent implements OnInit {
  account?: Account;
  transactions: Transaction[] = [];
  displayedColumns = ['date', 'description', 'amount', 'actions'];
  loading = true;

  private destroyRef = inject(DestroyRef);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: AccountApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(
      map(params => Number(params.get('id'))),
      switchMap(id => {
        this.loading = true;
        this.cdr.markForCheck();
        return forkJoin({
          account: this.api.getAccountById(id),
          transactions: this.api.getTransactionsByAccount(id),
        });
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ({ account, transactions }) => {
        this.account = account;
        this.transactions = transactions;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.router.navigate(['/accounts']);
      },
    });
  }

  getAccountIcon = getAccountIcon;

  addTransaction(): void {
    const ref = this.dialog.open(TransactionDialogComponent, {
      data: { accountId: this.account!.id },
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.api.createTransaction(result).subscribe(() => {
          this.snackBar.open('Transaction added', 'Close', { duration: 3000 });
          this.reloadData();
        });
      }
    });
  }

  deleteTransaction(txn: Transaction): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Transaction', message: `Delete "${txn.description}"?` },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.api.deleteTransaction(txn.id).subscribe(() => {
          this.snackBar.open('Transaction deleted', 'Close', { duration: 3000 });
          this.reloadData();
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/accounts']);
  }

  private reloadData(): void {
    if (this.account) {
      this.loading = true;
      this.cdr.markForCheck();
      forkJoin({
        account: this.api.getAccountById(this.account.id),
        transactions: this.api.getTransactionsByAccount(this.account.id),
      }).pipe(
        takeUntilDestroyed(this.destroyRef),
      ).subscribe({
        next: ({ account, transactions }) => {
          this.account = account;
          this.transactions = transactions;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
    }
  }
}
