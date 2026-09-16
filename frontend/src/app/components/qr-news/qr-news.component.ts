import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { NEWS_CATEGORY_STYLES, NEWS_RANGES, NewsArticle, NewsRange } from '../../models/research.model';
import { ResearchStore } from '../../services/research.store';

@Component({
  selector: 'app-qr-news',
  standalone: true,
  imports: [DatePipe, MatIconModule],
  templateUrl: './qr-news.component.html',
  styleUrl: './qr-news.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QrNewsComponent {
  readonly store = inject(ResearchStore);

  readonly ranges = NEWS_RANGES;
  readonly categoryStyles = NEWS_CATEGORY_STYLES;

  setRange(range: NewsRange): void {
    this.store.setNewsRange(range);
  }

  /** Wire-service thumbnails are not fetched offline, so each story gets a category tile. */
  tileGradient(article: Pick<NewsArticle, 'category'>): string {
    const style = this.categoryStyles[article.category];
    return `linear-gradient(135deg, ${style.from}, ${style.to})`;
  }
}
