/** Views implemented in the Quotes & Research overlay. */
export type ResearchView = 'analyst' | 'news';

export type NewsRange = '7d' | '30d' | 'all';

export type AnalystRatingLabel = 'Strong buy' | 'Buy' | 'Hold' | 'Underperform' | 'Sell';

export interface RatingBucket {
  label: AnalystRatingLabel;
  count: number;
}

export type AnalystActionType =
  | 'Upgrade'
  | 'Downgrade'
  | 'Initiated'
  | 'Reiterated'
  | 'Target raised'
  | 'Target lowered';

export interface AnalystAction {
  firm: string;
  action: AnalystActionType;
  rating: AnalystRatingLabel;
  priceTarget: number;
  date: string;
}

export interface AnalystRatings {
  symbol: string;
  currency: string;
  consensus: AnalystRatingLabel;
  /** 1.0 (strong buy) through 5.0 (sell), the convention used on the tape. */
  meanScore: number;
  analystCount: number;
  buckets: RatingBucket[];
  targetLow: number;
  targetMean: number;
  targetHigh: number;
  /** Third-party star rating shown alongside the consensus, 1-5. */
  morningstarStars: number;
  actions: AnalystAction[];
  updatedAt: Date;
}

export type NewsCategory = 'markets' | 'company' | 'analysis' | 'technology' | 'economy';

export interface NewsArticle {
  id: string;
  headline: string;
  source: string;
  publishedAt: Date;
  category: NewsCategory;
  symbol: string;
}

/** A run of article body copy: plain prose, or a ticker that links to that symbol's research. */
export type ArticleSegment = { kind: 'text'; text: string } | { kind: 'ticker'; symbol: string };

export interface ArticleParagraph {
  segments: ArticleSegment[];
}

export interface NewsArticleDetail extends NewsArticle {
  paragraphs: ArticleParagraph[];
  /** Tickers referenced in the body. Every one is in our universe, so no link is a dead end. */
  mentions: string[];
}

export const RATING_ORDER: readonly AnalystRatingLabel[] = [
  'Strong buy',
  'Buy',
  'Hold',
  'Underperform',
  'Sell',
];

export const NEWS_RANGES: readonly { value: NewsRange; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: 'all', label: 'All' },
];

/** Tile colours stand in for wire-service thumbnails, which we do not fetch offline. */
export const NEWS_CATEGORY_STYLES: Record<NewsCategory, { icon: string; from: string; to: string }> = {
  markets: { icon: 'candlestick_chart', from: '#1b3a63', to: '#2f6f9f' },
  company: { icon: 'apartment', from: '#3d2a5c', to: '#7a4fa3' },
  analysis: { icon: 'insights', from: '#0f4b43', to: '#2f8f7a' },
  technology: { icon: 'memory', from: '#22324f', to: '#4f6fa8' },
  economy: { icon: 'public', from: '#5c3320', to: '#a8693a' },
};
