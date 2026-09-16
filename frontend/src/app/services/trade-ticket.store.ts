import { DestroyRef, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Subscription, map } from 'rxjs';
import { datadogRum } from '@datadog/browser-rum';
import { Account } from '../models/account.model';
import {
  COMMISSION,
  OrderDraft,
  OrderExpiry,
  OrderPriceType,
  OrderSide,
  PlacedOrder,
  Position,
  Quote,
  TradePanel,
} from '../models/trade.model';
import { AccountApiService } from './account-api.service';
import { MarketDataService } from './market-data.service';

const FRACTIONAL_DECIMALS = 5;
/** "Max" leaves a small cushion so a price tick before review cannot overdraw the account. */
const MAX_QUANTITY_CUSHION = 0.005;
const DEFAULT_SYMBOL = 'NVDA';

/**
 * Holds the order ticket state for the whole session. It lives in the root injector so a
 * half-filled ticket survives collapsing the rail, and so the watchlist panel can hand a
 * symbol to the ticket without a route change.
 */
@Injectable({ providedIn: 'root' })
export class TradeTicketStore {
  private readonly api = inject(AccountApiService);
  private readonly market = inject(MarketDataService);

  readonly panel = signal<TradePanel | null>(null);
  readonly isOpen = computed(() => this.panel() !== null);

  readonly side = signal<OrderSide>('buy');
  readonly symbol = signal<string>(DEFAULT_SYMBOL);
  readonly priceType = signal<OrderPriceType>('market');
  readonly shares = signal<number>(0);
  readonly amount = signal<number>(0);
  readonly limitPrice = signal<number | null>(null);
  readonly stopPrice = signal<number | null>(null);
  readonly trailingAmount = signal<number | null>(null);
  readonly expiry = signal<OrderExpiry>('day');
  readonly expiryDate = signal<string | null>(null);
  readonly quoteExpanded = signal(true);

  readonly accounts = signal<Account[]>([]);
  readonly accountsLoading = signal(false);
  readonly accountId = signal<number | null>(null);
  /** Re-fetched whenever the selection changes, which is what drives the buying-power skeleton. */
  readonly selectedAccount = signal<Account | null>(null);
  readonly accountLoading = signal(false);

  readonly positions = signal<Position[]>([]);
  readonly positionsLoading = signal(false);

  readonly quote = signal<Quote | null>(null);
  readonly quoteLoading = signal(false);
  readonly quoteError = signal<string | null>(null);

  private readonly quoteRefresh = signal(0);
  private readonly accountRefresh = signal(0);
  private quoteSub?: Subscription;
  private accountSub?: Subscription;

  readonly buyingPower = computed(() => this.selectedAccount()?.balance ?? 0);

  /** The holding backing a sell: positions are tracked per funding account. */
  readonly currentPosition = computed(() => {
    const accountId = this.accountId();
    const symbol = this.symbol();
    if (accountId === null || !symbol) return null;
    return this.positions().find((p) => p.accountId === accountId && p.symbol === symbol) ?? null;
  });

  readonly sharesHeld = computed(() => this.currentPosition()?.quantity ?? 0);

  /** Market orders price off the far side of the spread; the others price off the user's input. */
  readonly estimatedPrice = computed(() => {
    const quote = this.quote();
    if (!quote) return 0;
    switch (this.priceType()) {
      case 'limit':
        return this.limitPrice() ?? 0;
      case 'stop':
        return this.stopPrice() ?? 0;
      default:
        return this.side() === 'buy' ? quote.ask : quote.bid;
    }
  });

  readonly fractionalAllowed = computed(() => !!this.quote()?.fractional && this.priceType() === 'market');

  readonly estimatedValue = computed(() => round2(this.shares() * this.estimatedPrice()));
  readonly estimatedTotal = computed(() =>
    round2(this.side() === 'buy' ? this.estimatedValue() + COMMISSION : this.estimatedValue() - COMMISSION),
  );

  /** Buying: what the account can afford. Selling: what it actually holds. */
  readonly maxShares = computed(() => {
    if (this.side() === 'sell') return this.sharesHeld();
    const price = this.estimatedPrice();
    if (price <= 0) return 0;
    const affordable = (this.buyingPower() * (1 - MAX_QUANTITY_CUSHION) - COMMISSION) / price;
    return affordable <= 0 ? 0 : this.roundShares(affordable);
  });

  readonly validationError = computed(() => {
    if (!this.accountId()) return 'Choose an account to continue.';
    if (!this.symbol()) return 'Enter a symbol to continue.';
    if (!this.quote()) return 'Waiting for a quote.';
    if (this.shares() <= 0) return 'Enter a quantity.';
    if (this.priceType() === 'limit' && !this.limitPrice()) return 'Enter a limit price.';
    if (this.priceType() === 'stop' && !this.stopPrice()) return 'Enter a stop price.';
    if (this.priceType() === 'trailing-stop-limit' && !this.trailingAmount()) return 'Enter a trailing amount.';
    if (this.expiry() === 'custom' && !this.expiryDate()) return 'Pick an expiry date.';
    if (this.side() === 'buy' && this.estimatedTotal() > this.buyingPower()) {
      return 'Estimated total exceeds your buying power.';
    }
    if (this.side() === 'sell') {
      if (!this.sharesHeld()) return `You do not hold ${this.symbol()} in this account.`;
      if (this.shares() > this.sharesHeld()) {
        return `You only hold ${formatShares(this.sharesHeld())} shares in this account.`;
      }
    }
    return null;
  });

  readonly canReview = computed(() => this.validationError() === null);

  readonly summaryLine = computed(() => {
    const symbol = this.symbol() || '—';
    const quantity = this.shares() ? formatShares(this.shares()) : '0';
    return `${this.side() === 'buy' ? 'Buy' : 'Sell'} ${quantity} ${symbol} ${this.priceQualifier()}`;
  });

  readonly expiryLine = computed(() =>
    this.expiry() === 'day' ? 'Expiring end of day' : `Expiring ${this.expiryDate() ?? '—'}`,
  );

  constructor() {
    // The quote feed only runs while the ticket is actually on screen.
    effect(() => {
      const symbol = this.panel() === 'stocks' ? this.symbol() : null;
      this.quoteRefresh();
      this.quoteSub?.unsubscribe();
      if (!symbol) return;

      if (untracked(() => this.quote())?.symbol !== symbol) {
        this.quote.set(null);
        this.quoteLoading.set(true);
      }
      this.quoteError.set(null);
      this.quoteSub = this.market.quoteStream(symbol).subscribe({
        next: (quote) => {
          this.quote.set(quote);
          this.quoteLoading.set(false);
        },
        error: (error: Error) => {
          this.quote.set(null);
          this.quoteLoading.set(false);
          this.quoteError.set(error.message);
        },
      });
    });

    effect(() => {
      const id = this.accountId();
      this.accountRefresh();
      this.accountSub?.unsubscribe();
      if (id === null) {
        this.selectedAccount.set(null);
        return;
      }
      this.accountLoading.set(true);
      this.accountSub = this.api.getAccountById(id).subscribe({
        next: (account) => {
          this.selectedAccount.set(account);
          this.accountLoading.set(false);
        },
        error: () => {
          this.selectedAccount.set(null);
          this.accountLoading.set(false);
        },
      });
    });

    // Any write elsewhere in the app (or an order placed from here) changes balances.
    let seenVersion = this.api.dataVersion();
    effect(() => {
      const version = this.api.dataVersion();
      if (version === seenVersion) return;
      seenVersion = version;
      this.reloadAccounts();
      this.reloadPositions();
      this.accountRefresh.update((n) => n + 1);
    });

    inject(DestroyRef).onDestroy(() => {
      this.quoteSub?.unsubscribe();
      this.accountSub?.unsubscribe();
    });
  }

  togglePanel(panel: TradePanel): void {
    const next = this.panel() === panel ? null : panel;
    this.panel.set(next);
    if (next) {
      this.loadAccounts();
      this.loadPositions();
      datadogRum.addAction('trade_panel_opened', { panel: next, symbol: this.symbol() });
    }
  }

  close(): void {
    this.panel.set(null);
  }

  /** Watchlist and positions hand-off: load a symbol into the ticket and bring it forward. */
  tradeSymbol(symbol: string, options: { accountId?: number; side?: OrderSide; source?: string } = {}): void {
    this.symbol.set(symbol.toUpperCase());
    this.shares.set(0);
    this.amount.set(0);
    if (options.accountId !== undefined) this.accountId.set(options.accountId);
    if (options.side) this.side.set(options.side);
    this.panel.set('stocks');
    this.loadAccounts();
    this.loadPositions();
    datadogRum.addAction('trade_symbol_selected', { symbol, source: options.source ?? 'watchlist' });
  }

  setSymbol(symbol: string): void {
    const next = symbol.trim().toUpperCase();
    if (next === this.symbol()) return;
    this.symbol.set(next);
    this.shares.set(0);
    this.amount.set(0);
  }

  setSide(side: OrderSide): void {
    this.side.set(side);
  }

  setPriceType(priceType: OrderPriceType): void {
    this.priceType.set(priceType);
    if (priceType === 'market') {
      // Market orders only ever expire at the end of the session.
      this.expiry.set('day');
      this.expiryDate.set(null);
    } else if (!this.quote()?.fractional) {
      this.setShares(Math.floor(this.shares()));
    }
  }

  setShares(value: number): void {
    const shares = this.roundShares(Math.max(value, 0));
    this.shares.set(shares);
    this.amount.set(round2(shares * this.estimatedPrice()));
  }

  setAmount(value: number): void {
    const amount = round2(Math.max(value, 0));
    this.amount.set(amount);
    const price = this.estimatedPrice();
    this.shares.set(price > 0 ? this.roundShares(amount / price) : 0);
  }

  useMaxShares(): void {
    this.setShares(this.maxShares());
  }

  setExpiry(expiry: OrderExpiry): void {
    this.expiry.set(expiry);
    if (expiry === 'day') this.expiryDate.set(null);
  }

  refreshQuote(): void {
    this.quoteRefresh.update((n) => n + 1);
  }

  loadAccounts(): void {
    if (this.accounts().length || this.accountsLoading()) return;
    this.reloadAccounts();
  }

  loadPositions(): void {
    if (this.positionsLoading()) return;
    this.reloadPositions();
  }

  private reloadPositions(): void {
    this.positionsLoading.set(true);
    this.api.getPositions().subscribe({
      next: (positions) => {
        this.positions.set(positions);
        this.positionsLoading.set(false);
      },
      error: () => this.positionsLoading.set(false),
    });
  }

  private reloadAccounts(): void {
    this.accountsLoading.set(true);
    this.api.getAccounts().subscribe({
      next: (accounts) => {
        this.accounts.set(accounts);
        this.accountsLoading.set(false);
      },
      error: () => this.accountsLoading.set(false),
    });
  }

  /** Clears the ticket but keeps the account selection, matching the Clear button on the ticket. */
  clear(): void {
    this.side.set('buy');
    this.priceType.set('market');
    this.shares.set(0);
    this.amount.set(0);
    this.limitPrice.set(null);
    this.stopPrice.set(null);
    this.trailingAmount.set(null);
    this.expiry.set('day');
    this.expiryDate.set(null);
  }

  buildDraft(): OrderDraft | null {
    const quote = this.quote();
    const account = this.selectedAccount();
    if (!quote || !account || !this.canReview()) return null;
    return {
      side: this.side(),
      symbol: quote.symbol,
      name: quote.name,
      currency: quote.currency,
      priceType: this.priceType(),
      shares: this.shares(),
      fractional: quote.fractional,
      estimatedPrice: this.estimatedPrice(),
      limitPrice: this.limitPrice(),
      stopPrice: this.stopPrice(),
      trailingAmount: this.trailingAmount(),
      expiry: this.expiry(),
      expiryDate: this.expiryDate(),
      accountId: account.id,
      accountLabel: accountLabel(account),
      buyingPower: account.balance,
      estimatedValue: this.estimatedValue(),
      commission: COMMISSION,
      estimatedTotal: this.estimatedTotal(),
      positionBefore: this.sharesHeld(),
    };
  }

  /**
   * Settles the order server-side: the funding account is debited or credited, the holding is
   * updated and the settlement transaction is recorded, all in one request.
   */
  placeOrder(draft: OrderDraft) {
    return this.api
      .placeOrder({
        accountId: draft.accountId,
        symbol: draft.symbol,
        name: draft.name,
        currency: draft.currency,
        side: draft.side,
        quantity: draft.shares,
        price: draft.estimatedPrice,
        priceType: draft.priceType,
      })
      .pipe(
        map((result): PlacedOrder => {
          datadogRum.addAction('trade_order_placed', {
            symbol: draft.symbol,
            side: draft.side,
            price_type: draft.priceType,
            shares: draft.shares,
            net_amount: result.netAmount,
            confirmation_number: result.confirmationNumber,
          });
          return { draft, result };
        }),
      );
  }

  /** Called once an order is confirmed. Balances refresh via the data-version effect. */
  onOrderPlaced(): void {
    this.clear();
  }

  private roundShares(value: number): number {
    if (!this.fractionalAllowed()) return Math.floor(value);
    const factor = 10 ** FRACTIONAL_DECIMALS;
    return Math.floor(value * factor) / factor;
  }

  private priceQualifier(): string {
    return priceQualifierFor({
      priceType: this.priceType(),
      limitPrice: this.limitPrice(),
      stopPrice: this.stopPrice(),
      trailingAmount: this.trailingAmount(),
    });
  }
}

export function accountLabel(account: Account): string {
  return `${account.name} ${account.accountNumber} (${account.currency})`;
}

export function formatShares(shares: number): string {
  return Number.isInteger(shares) ? String(shares) : shares.toFixed(FRACTIONAL_DECIMALS);
}

export function priceQualifierFor(
  order: Pick<OrderDraft, 'priceType' | 'limitPrice' | 'stopPrice' | 'trailingAmount'>,
): string {
  switch (order.priceType) {
    case 'limit':
      return `@ limit ${order.limitPrice ?? '—'}`;
    case 'stop':
      return `@ stop ${order.stopPrice ?? '—'}`;
    case 'trailing-stop-limit':
      return `@ trailing stop limit ${order.trailingAmount ?? '—'}`;
    default:
      return '@ market';
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
