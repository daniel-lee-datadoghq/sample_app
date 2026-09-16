import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Quote, REGION_FLAGS } from '../../models/trade.model';
import { MarketDataService } from '../../services/market-data.service';
import { ResearchStore } from '../../services/research.store';
import { TradeTicketStore } from '../../services/trade-ticket.store';

@Component({
  selector: 'app-trade-watchlist',
  standalone: true,
  imports: [DecimalPipe, MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="watchlist-body">
      <p class="intro">
        Tap a symbol to load it into the order ticket, or open research for the full picture.
      </p>
      @if (!quotes().length) {
        <div class="hint">Loading quotes…</div>
      }
      @for (quote of quotes(); track quote.symbol) {
        <div class="row">
          <button type="button" class="row-main" (click)="store.tradeSymbol(quote.symbol)">
            <span class="identity">
              <span class="symbol">{{ flags[quote.region] }} {{ quote.symbol }}</span>
              <span class="name">{{ quote.name }}</span>
            </span>
            <span class="pricing">
              <span class="last">{{ quote.last | number: '1.2-2' }} {{ quote.currency }}</span>
              <span class="change" [class.down]="quote.change < 0">
                {{ quote.change < 0 ? '' : '+' }}{{ quote.change | number: '1.2-2' }} ({{
                  quote.changePercent | number: '1.2-2'
                }}%)
              </span>
            </span>
          </button>
          <button
            mat-icon-button
            class="research"
            matTooltip="Quotes & research"
            [attr.aria-label]="'Research ' + quote.symbol"
            (click)="research.open(quote.symbol, 'watchlist')"
          >
            <mat-icon>insights</mat-icon>
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        min-height: 0;
        flex: 1;
      }

      .watchlist-body {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding: 12px 16px 16px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .intro,
      .hint {
        margin: 0 0 8px;
        font-size: 12px;
        color: var(--mat-sys-on-surface-variant);
      }

      .row {
        display: flex;
        align-items: center;
        gap: 4px;
        border-radius: 6px;

        &:hover {
          background-color: var(--mat-sys-surface-container-high);
        }
      }

      .row-main {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
        min-width: 0;
        padding: 10px 8px;
        border: 0;
        background: transparent;
        font: inherit;
        text-align: left;
        cursor: pointer;
      }

      .research mat-icon {
        color: var(--mat-sys-primary);
      }

      .identity {
        display: flex;
        flex-direction: column;
        min-width: 0;
        flex: 1;
      }

      .symbol {
        font-size: 13px;
        font-weight: 600;
      }

      .name {
        font-size: 11px;
        color: var(--mat-sys-on-surface-variant);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .pricing {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      }

      .last {
        font-size: 13px;
        font-weight: 600;
      }

      .change {
        font-size: 11px;
        font-weight: 600;
        color: #1b7f4b;

        &.down {
          color: var(--mat-sys-error);
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradeWatchlistComponent {
  readonly store = inject(TradeTicketStore);
  readonly research = inject(ResearchStore);
  private readonly market = inject(MarketDataService);

  readonly flags = REGION_FLAGS;
  readonly quotes = signal<Quote[]>([]);

  private sub?: Subscription;

  constructor() {
    // Only stream while the watchlist is the visible panel.
    effect(() => {
      this.sub?.unsubscribe();
      if (this.store.panel() !== 'watchlist') return;
      this.sub = this.market.watchlistStream().subscribe((quotes) => this.quotes.set(quotes));
    });

    inject(DestroyRef).onDestroy(() => this.sub?.unsubscribe());
  }
}
