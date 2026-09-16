import { Injectable, inject } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import {
  AnalystAction,
  AnalystActionType,
  AnalystRatingLabel,
  AnalystRatings,
  ArticleParagraph,
  ArticleSegment,
  NewsArticle,
  NewsArticleDetail,
  NewsCategory,
  RATING_ORDER,
  RatingBucket,
} from '../models/research.model';
import { MarketDataService } from './market-data.service';

const RESEARCH_LATENCY_MS = 450;
const ARTICLES_PER_SYMBOL = 16;
const ACTIONS_PER_SYMBOL = 6;
const NEWS_WINDOW_DAYS = 45;
const DAY_MS = 24 * 60 * 60 * 1000;

const FIRMS = [
  'RBC Capital Markets',
  'BMO Capital Markets',
  'Morgan Stanley',
  'Goldman Sachs',
  'Jefferies',
  'TD Cowen',
  'Wedbush',
  'Scotiabank',
  'Barclays',
  'Citi',
];

const SOURCES = [
  'The Fly',
  'Reuters',
  'Bloomberg',
  "Barron's",
  'MarketWatch',
  'Zacks',
  'Benzinga',
  'The Globe and Mail',
];

const ACTION_TYPES: readonly AnalystActionType[] = [
  'Upgrade',
  'Downgrade',
  'Initiated',
  'Reiterated',
  'Target raised',
  'Target lowered',
];

/** Headline shapes, filled in with the company name, ticker and business line. */
const HEADLINE_TEMPLATES: readonly { text: string; category: NewsCategory }[] = [
  { text: '{name} tops quarterly estimates as {segment} revenue climbs', category: 'company' },
  { text: 'Analysts lift {symbol} price targets following investor day', category: 'analysis' },
  { text: '{name} announces expanded share buyback programme', category: 'company' },
  { text: '{segment} demand drives a stronger outlook at {name}', category: 'company' },
  { text: "'Still early innings,' says top investor about {symbol}", category: 'analysis' },
  { text: '{name} deepens {segment} partnership with enterprise customers', category: 'technology' },
  { text: '{symbol} options activity points to a bullish tilt', category: 'markets' },
  { text: '{name} insiders trimmed holdings last quarter, filings show', category: 'company' },
  { text: 'Is {symbol} still a buy after this run?', category: 'analysis' },
  { text: '{name} named a top pick for the year ahead', category: 'analysis' },
  { text: 'Rate path leaves {symbol} investors weighing valuation', category: 'economy' },
  { text: '{name} expands {segment} capacity with new facility', category: 'technology' },
  { text: '{symbol} shares move on sector rotation into growth', category: 'markets' },
  { text: '{name} declares quarterly dividend', category: 'company' },
  { text: 'Supply chain easing lifts {segment} margins at {name}', category: 'economy' },
  { text: '{symbol} added to a widely followed model portfolio', category: 'markets' },
  { text: '{name} chief executive outlines multi-year {segment} roadmap', category: 'company' },
  { text: 'Short interest in {symbol} falls to a multi-month low', category: 'markets' },
];

/**
 * Article body copy. Three paragraphs per category so the prose matches the headline's topic.
 * `[[symbol]]` and `[[peer]]` mark tickers that render as links to that symbol's research.
 */
const BODY_TEMPLATES: Record<NewsCategory, readonly string[]> = {
  company: [
    '{name} ([[symbol]]) said its {segment} business carried results for the quarter, with management pointing to steadier demand than it had guided to three months ago. The company reiterated its full-year framework and said it would keep investing behind the same priorities.',
    'Executives spent much of the call on cost discipline, noting that the {segment} ramp is now far enough along to show operating leverage. Peers including [[peer]] have made similar arguments this season, and investors have rewarded the ones that paired growth with margin.',
    'Shares closed at {referencePrice} {currency} before the update. The stock has traded between {yearLow} and {yearHigh} over the past 52 weeks, a range that brackets most of the published analyst targets.',
  ],
  analysis: [
    'The debate around {name} ([[symbol]]) is no longer whether the {segment} story is real, but how much of it is already reflected at {referencePrice} {currency}. Bulls argue the earnings base is still being revised upward; sceptics point to a multiple that leaves little room for a stumble.',
    'Sell-side notes published this week land on both sides. Several desks nudged targets higher on the strength of the {segment} pipeline, while others held their ratings and flagged that the easy comparisons are behind the company.',
    'For context, the shares have covered {yearLow} to {yearHigh} in the past year. Holders weighing a trim have generally rotated toward names like [[peer]], where expectations have reset further.',
  ],
  markets: [
    'Trading in {name} ([[symbol]]) has picked up as money rotates within the sector. Volume has run above its recent average, and the move has come with unusually two-sided flow rather than a single directional bet.',
    'Desks describe the activity as positioning rather than conviction: funds squaring exposure ahead of the next catalyst, with [[peer]] seeing a similar pattern. That tends to exaggerate intraday swings without changing the underlying trend.',
    'The shares last changed hands around {referencePrice} {currency}, inside a 52-week band of {yearLow} to {yearHigh}.',
  ],
  technology: [
    '{name} ([[symbol]]) is expanding its {segment} footprint, a build-out the company has described as the constraint on how quickly it can convert demand into revenue. The additional capacity is expected to come online in stages.',
    'The announcement matters beyond the company itself. Suppliers and partners, [[peer]] among them, have tied their own forecasts to this class of spending, so the pace of the roll-out is being read as a sector signal.',
    'Management did not revise financial guidance alongside the news. The shares were last at {referencePrice} {currency}, having ranged from {yearLow} to {yearHigh} over the past year.',
  ],
  economy: [
    'Macro conditions are doing as much to set the tone for {name} ([[symbol]]) as anything company-specific. Input costs in {segment} have eased from their peak, and the relief is beginning to show up in reported margins.',
    'Rate expectations remain the swing factor. Longer-duration growth names, including [[peer]], have tracked the same path this quarter, tightening the correlation between the sector and the front end of the curve.',
    'The stock sits at {referencePrice} {currency} against a 52-week range of {yearLow} to {yearHigh}.',
  ],
};

/** The business line referenced in generated headlines. */
const SEGMENTS: Record<string, string> = {
  NVDA: 'data centre',
  GOOG: 'Cloud',
  AAPL: 'iPhone',
  MSFT: 'Azure',
  TSLA: 'energy storage',
  VOO: 'fund flow',
  SPY: 'fund flow',
  SHOP: 'merchant solutions',
  ENB: 'pipeline',
  XIC: 'fund flow',
};

/**
 * Stand-in for the research vendors behind a Quotes & Research widget. Everything is derived
 * from a per-symbol seed, so figures are stable across renders instead of flickering, while
 * still differing believably between symbols.
 */
@Injectable({ providedIn: 'root' })
export class ResearchDataService {
  private readonly market = inject(MarketDataService);

  /** Anchors generated dates so a session's data does not drift as the clock moves. */
  private readonly today = startOfToday();

  analystRatings(symbol: string): Observable<AnalystRatings> {
    return of(this.buildRatings(symbol)).pipe(delay(RESEARCH_LATENCY_MS));
  }

  news(symbol: string): Observable<NewsArticle[]> {
    return of(this.buildNews(symbol)).pipe(delay(RESEARCH_LATENCY_MS));
  }

  article(article: NewsArticle): Observable<NewsArticleDetail> {
    return of(this.buildArticle(article)).pipe(delay(RESEARCH_LATENCY_MS));
  }

  private buildRatings(symbol: string): AnalystRatings {
    const reference = this.market.referencePrice(symbol);
    const currency = this.market.currencyFor(symbol);
    const random = mulberry32(hash(`${symbol}:ratings`));

    const analystCount = 18 + Math.floor(random() * 22);
    const weights = [0.28, 0.32, 0.26, 0.09, 0.05].map((weight) => weight * (0.6 + random() * 0.8));
    const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);

    const buckets: RatingBucket[] = RATING_ORDER.map((label, index) => ({
      label,
      count: Math.max(0, Math.round((weights[index] / weightTotal) * analystCount)),
    }));
    const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0) || 1;

    // Weighted mean on the 1 (strong buy) to 5 (sell) scale.
    const meanScore =
      buckets.reduce((sum, bucket, index) => sum + bucket.count * (index + 1), 0) / total;

    const targetMean = round2(reference * (1.04 + random() * 0.16));
    return {
      symbol,
      currency,
      consensus: consensusFor(meanScore),
      meanScore: Math.round(meanScore * 100) / 100,
      analystCount: total,
      buckets,
      targetLow: round2(targetMean * (0.78 + random() * 0.08)),
      targetMean,
      targetHigh: round2(targetMean * (1.12 + random() * 0.14)),
      morningstarStars: 2 + Math.floor(random() * 4),
      actions: this.buildActions(symbol, targetMean),
      updatedAt: new Date(this.today.getTime() - Math.floor(random() * 3) * DAY_MS),
    };
  }

  private buildActions(symbol: string, targetMean: number): AnalystAction[] {
    const random = mulberry32(hash(`${symbol}:actions`));
    return Array.from({ length: ACTIONS_PER_SYMBOL }, (_, index) => {
      const firm = FIRMS[Math.floor(random() * FIRMS.length)];
      const action = ACTION_TYPES[Math.floor(random() * ACTION_TYPES.length)];
      return {
        firm,
        action,
        rating: ratingForAction(action, random()),
        priceTarget: round2(targetMean * (0.88 + random() * 0.26)),
        date: isoDate(new Date(this.today.getTime() - (index * 6 + Math.floor(random() * 5)) * DAY_MS)),
      };
    });
  }

  private buildArticle(article: NewsArticle): NewsArticleDetail {
    const { symbol } = article;
    const random = mulberry32(hash(`${article.id}:body`));
    const figures = this.market.referenceFigures(symbol);

    const peers = this.market.allSymbols().filter((candidate) => candidate !== symbol);
    const peer = peers[Math.floor(random() * peers.length)] ?? symbol;

    const values: Record<string, string> = {
      name: this.market.shortNameFor(symbol),
      symbol,
      segment: SEGMENTS[symbol] ?? 'core',
      currency: this.market.currencyFor(symbol),
      referencePrice: figures.reference.toFixed(2),
      yearLow: figures.yearLow.toFixed(2),
      yearHigh: figures.yearHigh.toFixed(2),
    };

    const paragraphs = BODY_TEMPLATES[article.category].map((template) =>
      buildParagraph(template, values, symbol, peer),
    );

    return { ...article, paragraphs, mentions: [symbol, peer] };
  }

  private buildNews(symbol: string): NewsArticle[] {
    const name = this.market.shortNameFor(symbol);
    const segment = SEGMENTS[symbol] ?? 'core';
    const random = mulberry32(hash(`${symbol}:news`));

    const templates = [...HEADLINE_TEMPLATES].sort(() => random() - 0.5).slice(0, ARTICLES_PER_SYMBOL);
    return templates
      .map((template, index) => {
        // Cluster recent stories near today and spread the rest across the window.
        const age = index < 4 ? random() * 6 : 6 + random() * (NEWS_WINDOW_DAYS - 6);
        const publishedAt = new Date(this.today.getTime() - age * DAY_MS + Math.floor(random() * 8) * 3_600_000);
        return {
          id: `${symbol}-${index}`,
          // Templates can open with a segment name, so sentence-case the result.
          headline: sentenceCase(
            template.text
              .replaceAll('{name}', name)
              .replaceAll('{symbol}', symbol)
              .replaceAll('{segment}', segment),
          ),
          source: SOURCES[Math.floor(random() * SOURCES.length)],
          publishedAt,
          category: template.category,
          symbol,
        };
      })
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  }
}

function consensusFor(meanScore: number): AnalystRatingLabel {
  if (meanScore < 1.8) return 'Strong buy';
  if (meanScore < 2.5) return 'Buy';
  if (meanScore < 3.4) return 'Hold';
  if (meanScore < 4.2) return 'Underperform';
  return 'Sell';
}

function ratingForAction(action: AnalystActionType, roll: number): AnalystRatingLabel {
  switch (action) {
    case 'Upgrade':
    case 'Target raised':
      return roll < 0.45 ? 'Strong buy' : 'Buy';
    case 'Downgrade':
    case 'Target lowered':
      return roll < 0.5 ? 'Hold' : 'Underperform';
    default:
      return roll < 0.6 ? 'Buy' : 'Hold';
  }
}

function buildParagraph(
  template: string,
  values: Record<string, string>,
  symbol: string,
  peer: string,
): ArticleParagraph {
  const filled = template.replace(/\{(\w+)\}/g, (_match, key: string) => values[key] ?? '');
  const segments: ArticleSegment[] = [];

  // Split on the ticker markers, keeping the surrounding prose (and its spacing) intact.
  for (const piece of filled.split(/(\[\[symbol\]\]|\[\[peer\]\])/)) {
    if (!piece) continue;
    if (piece === '[[symbol]]') segments.push({ kind: 'ticker', symbol });
    else if (piece === '[[peer]]') segments.push({ kind: 'ticker', symbol: peer });
    else segments.push({ kind: 'text', text: piece });
  }

  return { segments };
}

function sentenceCase(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function hash(value: string): number {
  let result = 2166136261;
  for (let index = 0; index < value.length; index++) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

/** Small deterministic PRNG so a symbol's research figures never change between renders. */
function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
