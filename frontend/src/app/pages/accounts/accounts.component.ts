import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe, TitleCasePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AccountApiService } from '../../services/account-api.service';
import { AuthService } from '../../services/auth.service';
import { Account } from '../../models/account.model';
import { AccountDialogComponent } from '../../components/account-dialog/account-dialog.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { getAccountIcon } from '../../utils/account-utils';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CurrencyPipe, TitleCasePipe, MatCardModule, MatTableModule, MatIconModule, MatChipsModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './accounts.component.html',
  styleUrl: './accounts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountsComponent implements OnInit {
  accounts: Account[] = [];
  displayedColumns = ['icon', 'name', 'type', 'accountNumber', 'balance', 'actions'];
  loading = true;

  private destroyRef = inject(DestroyRef);

  constructor(
    private api: AccountApiService,
    private auth: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.api.getAccounts().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: accounts => {
        this.accounts = accounts;
        this.loading = false;
        this.auth.updateUserType(accounts.reduce((sum, a) => sum + a.balance, 0));
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  getAccountIcon = getAccountIcon;

  viewAccount(account: Account): void {
    this.router.navigate(['/accounts', account.id]);
  }

  addAccount(): void {
    const ref = this.dialog.open(AccountDialogComponent, { data: {} });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.api.createAccount(result).subscribe(() => {
          this.snackBar.open('Account created', 'Close', { duration: 3000 });
          this.loadAccounts();
        });
      }
    });
  }

  editAccount(account: Account, event: Event): void {
    event.stopPropagation();
    const ref = this.dialog.open(AccountDialogComponent, { data: { account } });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.api.updateAccount(account.id, result).subscribe(() => {
          this.snackBar.open('Account updated', 'Close', { duration: 3000 });
          this.loadAccounts();
        });
      }
    });
  }

  deleteAccount(account: Account, event: Event): void {
    event.stopPropagation();
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Account', message: `Delete "${account.name}" and all its transactions?` },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.api.deleteAccount(account.id).subscribe(() => {
          this.snackBar.open('Account deleted', 'Close', { duration: 3000 });
          this.loadAccounts();
        });
      }
    });
  }
}
