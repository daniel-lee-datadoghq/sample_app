import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { Account } from '../../models/account.model';
import { AccountApiService } from '../../services/account-api.service';

export interface TransactionDialogData {
  accountId?: number;
}

@Component({
  selector: 'app-transaction-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatRadioModule],
  template: `
    <h2 mat-dialog-title>New Transaction</h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <mat-dialog-content class="dialog-content">
        <mat-form-field appearance="outline">
          <mat-label>Account</mat-label>
          <mat-select formControlName="accountId">
            @for (account of accounts; track account.id) {
              <mat-option [value]="account.id">{{ account.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <input matInput formControlName="description" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Amount</mat-label>
          <input matInput type="number" formControlName="amount" />
        </mat-form-field>

        <mat-radio-group formControlName="type" class="type-group">
          <mat-radio-button value="credit">Credit (+)</mat-radio-button>
          <mat-radio-button value="debit">Debit (-)</mat-radio-button>
        </mat-radio-group>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Cancel</button>
        <button mat-flat-button type="submit" [disabled]="form.invalid">Add Transaction</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .dialog-content {
      display: flex;
      flex-direction: column;
      min-width: 350px;
      gap: 4px;
    }
    .type-group {
      display: flex;
      gap: 16px;
      margin-bottom: 8px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionDialogComponent implements OnInit {
  form: FormGroup;
  accounts: Account[] = [];

  constructor(
    public dialogRef: MatDialogRef<TransactionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TransactionDialogData,
    private fb: FormBuilder,
    private api: AccountApiService,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      accountId: [data.accountId || null, Validators.required],
      description: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      type: ['debit', Validators.required],
    });
  }

  ngOnInit(): void {
    this.api.getAccounts().subscribe(accounts => {
      this.accounts = accounts;
      this.cdr.markForCheck();
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      const val = this.form.value;
      this.dialogRef.close({ ...val, amount: Math.abs(val.amount) });
    }
  }
}
