import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Account } from '../../models/account.model';
import { ORDER_PRICE_TYPES, OrderExpiry, OrderPriceType, OrderSide, REGION_FLAGS, SymbolSummary } from '../../models/trade.model';
import { AuthService } from '../../services/auth.service';
import { MarketDataService } from '../../services/market-data.service';
import { ResearchStore } from '../../services/research.store';
import { TradeTicketStore, accountLabel, formatShares } from '../../services/trade-ticket.store';
import { TradeReviewDialogComponent } from '../trade-review-dialog/trade-review-dialog.component';

@Component({
  selector: 'app-trade-ticket',
  standalone: true,
  imports: [
    CurrencyPipe,
    DecimalPipe,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  templateUrl: './trade-ticket.component.html',
  styleUrl: './trade-ticket.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradeTicketComponent {
  readonly store = inject(TradeTicketStore);
  readonly research = inject(ResearchStore);
  private readonly market = inject(MarketDataService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly auth = inject(AuthService);

  readonly priceTypes = ORDER_PRICE_TYPES;
  readonly flags = REGION_FLAGS;
  readonly accountLabel = accountLabel;
  readonly formatShares = formatShares;

  readonly symbolControl = new FormControl('', { nonNullable: true });
  readonly matches = signal<SymbolSummary[]>([]);
  readonly searching = signal(false);

  readonly ownerName = this.auth.user()?.name ?? 'My accounts';

  constructor() {
    this.symbolControl.setValue(this.store.symbol());

    // Keep the field in step with the store when the watchlist or Clear changes the symbol.
    effect(() => {
      const symbol = this.store.symbol();
      if (this.symbolControl.value !== symbol) {
        this.symbolControl.setValue(symbol, { emitEvent: false });
      }
    });

    this.symbolControl.valueChanges
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        switchMap((term) => {
          this.searching.set(true);
          return this.market.searchSymbols(term);
        }),
        takeUntilDestroyed(),
      )
      .subscribe((matches) => {
        this.matches.set(matches);
        this.searching.set(false);
      });
  }

  /** Quote timestamps are shown on the Eastern exchange clock, as they are on the tape. */
  get asOfEt(): string {
    const asOf = this.store.quote()?.asOf ?? new Date();
    return asOf.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: false });
  }

  accountFlag(account: Account): string {
    return REGION_FLAGS[account.currency === 'CAD' ? 'CA' : 'US'];
  }

  absChange(value: number): number {
    return Math.abs(value);
  }

  onSymbolSelected(symbol: string): void {
    this.store.setSymbol(symbol);
    this.symbolControl.setValue(symbol, { emitEvent: false });
  }

  /** Enter or blur commits the typed symbol when it is an exact match. */
  commitTypedSymbol(): void {
    const typed = this.symbolControl.value.trim().toUpperCase();
    if (!typed) return;
    if (this.matches().some((match) => match.symbol === typed)) {
      this.store.setSymbol(typed);
    }
  }

  setSide(side: OrderSide): void {
    this.store.setSide(side);
  }

  setPriceType(priceType: OrderPriceType): void {
    this.store.setPriceType(priceType);
  }

  setExpiry(expiry: OrderExpiry): void {
    this.store.setExpiry(expiry);
  }

  onSharesInput(value: string): void {
    this.store.setShares(Number(value) || 0);
  }

  onAmountInput(value: string): void {
    this.store.setAmount(Number(value) || 0);
  }

  onNumericInput(target: 'limitPrice' | 'stopPrice' | 'trailingAmount', value: string): void {
    const parsed = Number(value);
    this.store[target].set(value === '' || Number.isNaN(parsed) ? null : parsed);
  }

  review(): void {
    const draft = this.store.buildDraft();
    if (!draft) return;
    this.dialog
      .open(TradeReviewDialogComponent, { data: draft, autoFocus: 'dialog' })
      .afterClosed()
      .subscribe((placed) => {
        if (!placed) return;
        this.store.onOrderPlaced();
        this.snackBar.open(`Order ${placed.result.confirmationNumber} submitted`, 'Close', {
          duration: 4000,
        });
      });
  }
}
