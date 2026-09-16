import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { datadogRum } from '@datadog/browser-rum';
import { ORDER_PRICE_TYPES, OrderDraft, PlacedOrder } from '../../models/trade.model';
import { TradeTicketStore, formatShares } from '../../services/trade-ticket.store';

@Component({
  selector: 'app-trade-review-dialog',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    TitleCasePipe,
    MatDialogModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './trade-review-dialog.component.html',
  styleUrl: './trade-review-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradeReviewDialogComponent {
  readonly draft = inject<OrderDraft>(MAT_DIALOG_DATA);
  readonly dialogRef = inject<MatDialogRef<TradeReviewDialogComponent, PlacedOrder | null>>(MatDialogRef);

  private readonly store = inject(TradeTicketStore);

  readonly placing = signal(false);
  readonly placed = signal<PlacedOrder | null>(null);
  readonly error = signal<string | null>(null);

  readonly formatShares = formatShares;

  constructor() {
    datadogRum.addAction('trade_order_reviewed', {
      symbol: this.draft.symbol,
      side: this.draft.side,
      price_type: this.draft.priceType,
      shares: this.draft.shares,
      estimated_total: this.draft.estimatedTotal,
    });
  }

  get priceTypeLabel(): string {
    return ORDER_PRICE_TYPES.find((type) => type.value === this.draft.priceType)?.label ?? this.draft.priceType;
  }

  get expiryLabel(): string {
    return this.draft.expiry === 'day' ? 'Day — expiring end of day' : `Custom — ${this.draft.expiryDate}`;
  }

  /** Shares held in the funding account once this order settles. */
  get positionAfter(): number {
    const delta = this.draft.side === 'buy' ? this.draft.shares : -this.draft.shares;
    return Math.round((this.draft.positionBefore + delta) * 1e5) / 1e5;
  }

  get buyingPowerAfter(): number {
    const delta = this.draft.side === 'buy' ? -this.draft.estimatedTotal : this.draft.estimatedTotal;
    return Math.round((this.draft.buyingPower + delta) * 100) / 100;
  }

  placeOrder(): void {
    if (this.placing()) return;
    this.placing.set(true);
    this.error.set(null);
    this.store.placeOrder(this.draft).subscribe({
      next: (placed) => {
        this.placing.set(false);
        this.placed.set(placed);
      },
      error: () => {
        this.placing.set(false);
        this.error.set('We could not place your order. Please review the ticket and try again.');
      },
    });
  }

  done(): void {
    this.dialogRef.close(this.placed());
  }
}
