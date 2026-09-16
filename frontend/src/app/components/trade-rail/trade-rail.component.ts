import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TradePanel } from '../../models/trade.model';
import { TradeTicketStore } from '../../services/trade-ticket.store';
import { TradePositionsComponent } from '../trade-positions/trade-positions.component';
import { TradeTicketComponent } from '../trade-ticket/trade-ticket.component';
import { TradeWatchlistComponent } from '../trade-watchlist/trade-watchlist.component';

interface RailLauncher {
  panel: TradePanel;
  icon: string;
  label: string;
  title: string;
}

const LAUNCHERS: readonly RailLauncher[] = [
  { panel: 'stocks', icon: 'trending_up', label: 'Stocks & ETFs', title: 'Trade Stocks & ETFs' },
  { panel: 'positions', icon: 'donut_large', label: 'Positions', title: 'Your Positions' },
  { panel: 'watchlist', icon: 'star_border', label: 'Watchlists', title: 'Watchlists' },
];

/**
 * Persistent right-edge launcher plus the slide-in trade panel. The panel is a non-modal
 * overlay: the page underneath stays interactive and the URL never changes, so an order can
 * be filled in while the user keeps browsing.
 */
@Component({
  selector: 'app-trade-rail',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    TradePositionsComponent,
    TradeTicketComponent,
    TradeWatchlistComponent,
  ],
  templateUrl: './trade-rail.component.html',
  styleUrl: './trade-rail.component.scss',
  host: {
    '(document:keydown)': 'onKeydown($event)',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradeRailComponent {
  readonly store = inject(TradeTicketStore);
  private readonly dialog = inject(MatDialog);

  readonly launchers = LAUNCHERS;

  /** The panels stay mounted after the first open so a part-filled ticket is never lost. */
  readonly mounted = signal(false);

  readonly title = computed(
    () => LAUNCHERS.find((launcher) => launcher.panel === this.store.panel())?.title ?? '',
  );

  constructor() {
    effect(() => {
      if (this.store.isOpen()) this.mounted.set(true);
    });
  }

  /** Escape collapses the panel, unless a dialog or a select overlay already claimed the key. */
  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || event.defaultPrevented || this.dialog.openDialogs.length) return;
    this.store.close();
  }
}
