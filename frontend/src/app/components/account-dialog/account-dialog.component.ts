import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Account } from '../../models/account.model';

export interface AccountDialogData {
  account?: Account;
}

@Component({
  selector: 'app-account-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>{{ data.account ? 'Edit Account' : 'New Account' }}</h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <mat-dialog-content class="dialog-content">
        <mat-form-field appearance="outline">
          <mat-label>Account Name</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Type</mat-label>
          <mat-select formControlName="type">
            <mat-option value="checking">Checking</mat-option>
            <mat-option value="savings">Savings</mat-option>
            <mat-option value="credit">Credit</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Account Number</mat-label>
          <input matInput formControlName="accountNumber" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Balance</mat-label>
          <input matInput type="number" formControlName="balance" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Currency</mat-label>
          <input matInput formControlName="currency" />
        </mat-form-field>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Cancel</button>
        <button mat-flat-button type="submit" [disabled]="form.invalid">Save</button>
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
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountDialogComponent {
  form: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<AccountDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AccountDialogData,
    private fb: FormBuilder,
  ) {
    const a = data.account;
    this.form = this.fb.group({
      name: [a?.name ?? '', Validators.required],
      type: [a?.type ?? 'checking', Validators.required],
      accountNumber: [a?.accountNumber ?? '', Validators.required],
      balance: [a?.balance ?? 0, Validators.required],
      currency: [a?.currency ?? 'USD', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
