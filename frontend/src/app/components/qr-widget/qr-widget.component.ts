import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DecimalPipe } from '@angular/common';
import { ResearchView } from '../../models/research.model';
import { REGION_FLAGS, SymbolSummary } from '../../models/trade.model';
import { MarketDataService } from '../../services/market-data.service';
import { ResearchStore } from '../../services/research.store';
import { TradeTicketStore } from '../../services/trade-ticket.store';
import { QrAnalystRatingsComponent } from '../qr-analyst-ratings/qr-analyst-ratings.component';
import { QrNewsComponent } from '../qr-news/qr-news.component';

const VIEWS: readonly { value: ResearchView; label: string }[] = [
  { value: 'analyst', label: 'Analyst ratings' },
  { value: 'news', label: 'News' },
];

/**
 * The Quotes & Research overlay. It floats over the current page with its own scrim, and
 * slides clear of the trade drawer when the Trade button opens a ticket, so both stay usable.
 */
@Component({
  selector: 'app-qr-widget',
  standalone: true,
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    QrAnalystRatingsComponent,
    QrNewsComponent,
  ],
  templateUrl: './qr-widget.component.html',
  styleUrl: './qr-widget.component.scss',
  host: {
    '(document:keydown)': 'onKeydown($event)',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QrWidgetComponent {
  readonly store = inject(ResearchStore);
  readonly tradeStore = inject(TradeTicketStore);
  private readonly market = inject(MarketDataService);
  private readonly dialog = inject(MatDialog);

  readonly views = VIEWS;
  readonly flags = REGION_FLAGS;

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly matches = signal<SymbolSummary[]>([]);

  constructor() {
    // Clear the search box whenever a different symbol is loaded.
    effect(() => {
      this.store.symbol();
      if (this.searchControl.value) this.searchControl.setValue('', { emitEvent: false });
    });

    this.searchControl.valueChanges
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        switchMap((term) => this.market.searchSymbols(term)),
        takeUntilDestroyed(),
      )
      .subscribe((matches) => this.matches.set(matches));
  }

  get asOf(): string {
    const asOf = this.store.quote()?.asOf ?? new Date();
    return asOf.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  /** Stand-in for the vendor logo shown beside the ticker. */
  get monogram(): string {
    return (this.store.symbol() ?? '?').charAt(0);
  }

  abs(value: number): number {
    return Math.abs(value);
  }

  onSymbolSelected(symbol: string): void {
    this.store.open(symbol, 'research_header_search');
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    // The trade drawer and any dialog claim Escape first.
    if (this.dialog.openDialogs.length || this.tradeStore.isOpen()) return;
    this.store.close();
  }
}
