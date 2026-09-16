import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AnalystRatings } from '../../models/research.model';
import { ResearchStore } from '../../services/research.store';

@Component({
  selector: 'app-qr-analyst-ratings',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, DecimalPipe, MatIconModule, MatTooltipModule],
  templateUrl: './qr-analyst-ratings.component.html',
  styleUrl: './qr-analyst-ratings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QrAnalystRatingsComponent {
  readonly store = inject(ResearchStore);

  readonly stars = [1, 2, 3, 4, 5];

  /** Widest bucket drives the bar widths so the distribution reads at a glance. */
  readonly maxBucket = computed(() =>
    Math.max(1, ...(this.store.ratings()?.buckets.map((bucket) => bucket.count) ?? [1])),
  );

  barWidth(count: number): string {
    return `${Math.round((count / this.maxBucket()) * 100)}%`;
  }

  /** Where the live price sits inside the low-to-high target range, as a percentage. */
  pricePosition(ratings: AnalystRatings): number {
    const last = this.store.quote()?.last ?? ratings.targetMean;
    const span = ratings.targetHigh - ratings.targetLow || 1;
    return Math.min(100, Math.max(0, ((last - ratings.targetLow) / span) * 100));
  }

  targetPosition(ratings: AnalystRatings): number {
    const span = ratings.targetHigh - ratings.targetLow || 1;
    return Math.min(100, Math.max(0, ((ratings.targetMean - ratings.targetLow) / span) * 100));
  }

  bucketClass(label: string): string {
    return label.toLowerCase().replace(' ', '-');
  }
}
