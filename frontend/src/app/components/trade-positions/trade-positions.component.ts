import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Position, Quote, REGION_FLAGS } from '../../models/trade.model';
import { MarketDataService } from '../../services/market-data.service';
import { TradeTicketStore, formatShares } from '../../services/trade-ticket.store';

interface HoldingRow {
  position: Position;
  quote: Quote | null;
  marketValue: number;
  gain: number;
  gainPercent: number;
}

/** Holdings are per funding account, so the panel groups by account to keep them distinct. */
interface AccountGroup {
  accountId: number;
  accountName: string;
  accountNumber: string;
  marketValue: number;
  rows: HoldingRow[];
}

@Component({
  selector: 'app-trade-positions',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './trade-positions.component.html',
  styleUrl: './trade-positions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradePositionsComponent {
  readonly store = inject(TradeTicketStore);
  private readonly market = inject(MarketDataService);

  readonly flags = REGION_FLAGS;
  readonly formatShares = formatShares;

  private readonly quotes = signal<Map<string, Quote>>(new Map());

  /** Marks every holding to market off the same simulated feed the ticket uses. */
  readonly rows = computed<HoldingRow[]>(() =>
    this.store.positions().map((position) => {
      const quote = this.quotes().get(position.symbol) ?? null;
      const marketValue = quote ? quote.last * position.quantity : position.costBasis;
      const gain = marketValue - position.costBasis;
      return {
        position,
        quote,
        marketValue,
        gain,
        gainPercent: position.costBasis ? (gain / position.costBasis) * 100 : 0,
      };
    }),
  );

  readonly groups = computed<AccountGroup[]>(() => {
    const groups = new Map<number, AccountGroup>();
    for (const row of this.rows()) {
      const { accountId, accountName, accountNumber } = row.position;
      const group = groups.get(accountId) ?? { accountId, accountName, accountNumber, marketValue: 0, rows: [] };
      group.marketValue += row.marketValue;
      group.rows.push(row);
      groups.set(accountId, group);
    }
    return [...groups.values()].sort((a, b) => a.accountName.localeCompare(b.accountName));
  });

  readonly totalValue = computed(() => this.rows().reduce((sum, row) => sum + row.marketValue, 0));
  readonly totalGain = computed(() => this.rows().reduce((sum, row) => sum + row.gain, 0));

  private sub?: Subscription;

  constructor() {
    // Re-subscribe when the panel opens or the set of held symbols changes.
    effect(() => {
      const symbols = this.store.positions().map((position) => position.symbol);
      const live = this.store.panel() === 'positions' && symbols.length > 0;
      this.sub?.unsubscribe();
      if (!live) return;
      this.sub = this.market.quotesStream(symbols).subscribe((quotes) => {
        this.quotes.set(new Map(quotes.map((quote) => [quote.symbol, quote])));
      });
    });

    inject(DestroyRef).onDestroy(() => this.sub?.unsubscribe());
  }

  trade(row: HoldingRow): void {
    this.store.tradeSymbol(row.position.symbol, {
      accountId: row.position.accountId,
      source: 'positions',
    });
  }

  sell(row: HoldingRow): void {
    this.store.tradeSymbol(row.position.symbol, {
      accountId: row.position.accountId,
      side: 'sell',
      source: 'positions',
    });
  }
}
