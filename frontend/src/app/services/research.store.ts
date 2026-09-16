import { DestroyRef, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Subscription } from 'rxjs';
import { datadogRum } from '@datadog/browser-rum';
import { Quote } from '../models/trade.model';
import {
  AnalystRatings,
  NewsArticle,
  NewsArticleDetail,
  NewsRange,
  ResearchView,
} from '../models/research.model';
import { MarketDataService } from './market-data.service';
import { ResearchDataService } from './research-data.service';
import { TradeTicketStore } from './trade-ticket.store';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * State for the Quotes & Research overlay. It is a page-level overlay rather than a route, so
 * it can sit over whatever the user was looking at and hand a symbol to the trade ticket
 * without losing its place.
 */
@Injectable({ providedIn: 'root' })
export class ResearchStore {
  private readonly market = inject(MarketDataService);
  private readonly research = inject(ResearchDataService);
  private readonly tradeStore = inject(TradeTicketStore);

  readonly symbol = signal<string | null>(null);
  readonly isOpen = computed(() => this.symbol() !== null);
  readonly view = signal<ResearchView>('analyst');
  readonly newsRange = signal<NewsRange>('all');

  readonly quote = signal<Quote | null>(null);
  readonly quoteLoading = signal(false);

  readonly ratings = signal<AnalystRatings | null>(null);
  readonly ratingsLoading = signal(false);

  readonly articles = signal<NewsArticle[]>([]);
  readonly newsLoading = signal(false);

  /** Set while a single story is open; the news list is replaced by the article in place. */
  readonly selectedArticleId = signal<string | null>(null);
  readonly article = signal<NewsArticleDetail | null>(null);
  readonly articleLoading = signal(false);

  /** True while the visible view is still fetching, which dims the body and shows a spinner. */
  readonly viewLoading = computed(() =>
    this.view() === 'analyst'
      ? this.ratingsLoading()
      : this.newsLoading() || this.articleLoading(),
  );

  readonly visibleArticles = computed(() => {
    const range = this.newsRange();
    if (range === 'all') return this.articles();
    const cutoff = Date.now() - (range === '7d' ? 7 : 30) * DAY_MS;
    return this.articles().filter((article) => article.publishedAt.getTime() >= cutoff);
  });

  /** Upside implied by the mean analyst target against the live price. */
  readonly targetUpside = computed(() => {
    const ratings = this.ratings();
    const last = this.quote()?.last;
    if (!ratings || !last) return null;
    return ((ratings.targetMean - last) / last) * 100;
  });

  private quoteSub?: Subscription;
  private ratingsSub?: Subscription;
  private newsSub?: Subscription;
  private articleSub?: Subscription;

  constructor() {
    // Live header quote, only while the overlay is on screen.
    effect(() => {
      const symbol = this.symbol();
      this.quoteSub?.unsubscribe();
      if (!symbol) return;
      if (untracked(() => this.quote())?.symbol !== symbol) {
        this.quote.set(null);
        this.quoteLoading.set(true);
      }
      this.quoteSub = this.market.quoteStream(symbol).subscribe({
        next: (quote) => {
          this.quote.set(quote);
          this.quoteLoading.set(false);
        },
        error: () => this.quoteLoading.set(false),
      });
    });

    // Each view fetches on demand, the way the real widget loads a tab when it is opened.
    effect(() => {
      const symbol = this.symbol();
      const view = this.view();
      if (!symbol) return;
      if (view === 'analyst') this.fetchRatings(symbol);
      else this.fetchNews(symbol);
    });

    inject(DestroyRef).onDestroy(() => {
      this.quoteSub?.unsubscribe();
      this.ratingsSub?.unsubscribe();
      this.newsSub?.unsubscribe();
      this.articleSub?.unsubscribe();
    });
  }

  open(symbol: string, source: string): void {
    const next = symbol.trim().toUpperCase();
    if (!this.market.isKnown(next)) return;
    if (this.symbol() !== next) {
      this.ratings.set(null);
      this.articles.set([]);
      this.clearArticle();
    }
    this.symbol.set(next);
    datadogRum.addAction('research_widget_opened', { symbol: next, source, view: this.view() });
  }

  close(): void {
    this.symbol.set(null);
  }

  setView(view: ResearchView): void {
    if (this.view() === view) return;
    // Leaving and re-entering News should land on the list, not the story you last read.
    this.clearArticle();
    this.view.set(view);
    datadogRum.addAction('research_view_selected', { symbol: this.symbol(), view });
  }

  setNewsRange(range: NewsRange): void {
    this.newsRange.set(range);
  }

  openArticle(article: NewsArticle): void {
    this.selectedArticleId.set(article.id);
    this.article.set(null);
    this.articleSub?.unsubscribe();
    this.articleLoading.set(true);
    this.articleSub = this.research.article(article).subscribe({
      next: (detail) => {
        this.article.set(detail);
        this.articleLoading.set(false);
      },
      error: () => this.articleLoading.set(false),
    });
    datadogRum.addAction('research_article_opened', {
      symbol: article.symbol,
      article_id: article.id,
      source: article.source,
      headline: article.headline,
    });
  }

  backToList(): void {
    this.clearArticle();
  }

  /** A ticker link inside article copy loads that symbol's research in place. */
  openMentionedSymbol(symbol: string): void {
    this.clearArticle();
    this.open(symbol, 'news_article_link');
  }

  /** The widget's Trade button: opens the trade ticket over the page with this symbol loaded. */
  trade(): void {
    const symbol = this.symbol();
    if (!symbol) return;
    this.tradeStore.tradeSymbol(symbol, { source: 'research' });
    datadogRum.addAction('research_trade_clicked', { symbol, view: this.view() });
  }

  private clearArticle(): void {
    this.articleSub?.unsubscribe();
    this.articleLoading.set(false);
    this.selectedArticleId.set(null);
    this.article.set(null);
  }

  private fetchRatings(symbol: string): void {
    if (untracked(() => this.ratings())?.symbol === symbol) return;
    this.ratingsSub?.unsubscribe();
    this.ratingsLoading.set(true);
    this.ratingsSub = this.research.analystRatings(symbol).subscribe({
      next: (ratings) => {
        this.ratings.set(ratings);
        this.ratingsLoading.set(false);
      },
      error: () => this.ratingsLoading.set(false),
    });
  }

  private fetchNews(symbol: string): void {
    if (untracked(() => this.articles()).some((article) => article.symbol === symbol)) return;
    this.newsSub?.unsubscribe();
    this.newsLoading.set(true);
    this.newsSub = this.research.news(symbol).subscribe({
      next: (articles) => {
        this.articles.set(articles);
        this.newsLoading.set(false);
      },
      error: () => this.newsLoading.set(false),
    });
  }
}
