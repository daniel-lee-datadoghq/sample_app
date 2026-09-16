import { Injectable } from '@angular/core';
import { Observable, delay, map, of, throwError, timer } from 'rxjs';
import { Quote, SymbolSummary } from '../models/trade.model';

interface SymbolSeed extends SymbolSummary {
  /** Conversational name used in generated headlines, where the share class reads badly. */
  shortName: string;
  prevClose: number;
  open: number;
  volume: number;
  yearLow: number;
  yearHigh: number;
}

/** Mutable per-symbol state so quotes keep walking between subscriptions. */
interface LiveState {
  last: number;
  dayLow: number;
  dayHigh: number;
  volume: number;
}

const QUOTE_TICK_MS = 2_000;
/** Simulated round-trip so the ticket shows its loading skeletons, like a real feed. */
const QUOTE_LATENCY_MS = 400;
const SEARCH_LATENCY_MS = 250;
const MAX_SEARCH_RESULTS = 6;

const SEEDS: readonly SymbolSeed[] = [
  { symbol: 'NVDA', name: 'NVIDIA Corporation', shortName: 'NVIDIA', currency: 'USD', region: 'US', fractional: true, prevClose: 220.78, open: 217.04, volume: 72_241_777, yearLow: 164.07, yearHigh: 236.54 },
  { symbol: 'GOOG', name: 'Alphabet Cl C Ord', shortName: 'Alphabet', currency: 'USD', region: 'US', fractional: true, prevClose: 335.31, open: 332.10, volume: 7_481_941, yearLow: 233.38, yearHigh: 404.47 },
  { symbol: 'AAPL', name: 'Apple Inc.', shortName: 'Apple', currency: 'USD', region: 'US', fractional: true, prevClose: 232.41, open: 231.88, volume: 41_902_310, yearLow: 169.21, yearHigh: 260.10 },
  { symbol: 'MSFT', name: 'Microsoft Corporation', shortName: 'Microsoft', currency: 'USD', region: 'US', fractional: true, prevClose: 418.62, open: 420.15, volume: 18_774_002, yearLow: 344.79, yearHigh: 468.35 },
  { symbol: 'TSLA', name: 'Tesla, Inc.', shortName: 'Tesla', currency: 'USD', region: 'US', fractional: true, prevClose: 341.19, open: 338.02, volume: 88_120_455, yearLow: 212.11, yearHigh: 488.54 },
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', shortName: 'the Vanguard S&P 500 ETF', currency: 'USD', region: 'US', fractional: true, prevClose: 561.44, open: 562.90, volume: 5_204_118, yearLow: 464.20, yearHigh: 583.02 },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', shortName: 'the SPDR S&P 500 ETF', currency: 'USD', region: 'US', fractional: false, prevClose: 610.72, open: 612.31, volume: 44_310_909, yearLow: 505.44, yearHigh: 634.18 },
  { symbol: 'SHOP', name: 'Shopify Inc.', shortName: 'Shopify', currency: 'CAD', region: 'CA', fractional: false, prevClose: 152.88, open: 151.40, volume: 3_118_240, yearLow: 92.35, yearHigh: 178.94 },
  { symbol: 'ENB', name: 'Enbridge Inc.', shortName: 'Enbridge', currency: 'CAD', region: 'CA', fractional: false, prevClose: 64.12, open: 64.35, volume: 6_402_887, yearLow: 48.90, yearHigh: 66.71 },
  { symbol: 'XIC', name: 'iShares Core S&P/TSX Capped Composite Index ETF', shortName: 'the iShares Core S&P/TSX ETF', currency: 'CAD', region: 'CA', fractional: false, prevClose: 40.18, open: 40.24, volume: 812_440, yearLow: 33.05, yearHigh: 41.60 },
];

/**
 * Stand-in for a market data feed. Prices random-walk on a fixed interval so the
 * order ticket behaves like a live quote board without needing a real provider.
 */
@Injectable({ providedIn: 'root' })
export class MarketDataService {
  private readonly live = new Map<string, LiveState>();

  /** Symbols shown in the rail's watchlist panel. */
  readonly watchlistSymbols: readonly string[] = ['NVDA', 'AAPL', 'VOO', 'SHOP', 'ENB'];

  searchSymbols(term: string): Observable<SymbolSummary[]> {
    const query = term.trim().toUpperCase();
    const matches = SEEDS.filter(
      (seed) => !query || seed.symbol.startsWith(query) || seed.name.toUpperCase().includes(query),
    ).slice(0, MAX_SEARCH_RESULTS);
    return of(matches.map(toSummary)).pipe(delay(SEARCH_LATENCY_MS));
  }

  /** Emits a first quote after a short delay, then a fresh tick every 2s until unsubscribed. */
  quoteStream(symbol: string): Observable<Quote> {
    const seed = findSeed(symbol);
    if (!seed) {
      return throwError(() => new Error(`No quote available for "${symbol}"`)).pipe(delay(QUOTE_LATENCY_MS));
    }
    return timer(QUOTE_LATENCY_MS, QUOTE_TICK_MS).pipe(map(() => this.tick(seed)));
  }

  /** Streams a fresh quote for every known symbol in the list, ticking together. */
  quotesStream(symbols: readonly string[]): Observable<Quote[]> {
    const seeds = symbols.map(findSeed).filter((seed): seed is SymbolSeed => !!seed);
    if (!seeds.length) return of([]);
    return timer(0, QUOTE_TICK_MS).pipe(map(() => seeds.map((seed) => this.tick(seed))));
  }

  watchlistStream(): Observable<Quote[]> {
    return this.quotesStream(this.watchlistSymbols);
  }

  /** Previous close, used by research figures that should not move with the live tape. */
  referencePrice(symbol: string): number {
    return findSeed(symbol)?.prevClose ?? 0;
  }

  /** Static figures safe to quote in generated prose without contradicting the ticking header. */
  referenceFigures(symbol: string): { reference: number; yearLow: number; yearHigh: number } {
    const seed = findSeed(symbol);
    return {
      reference: seed?.prevClose ?? 0,
      yearLow: seed?.yearLow ?? 0,
      yearHigh: seed?.yearHigh ?? 0,
    };
  }

  nameFor(symbol: string): string {
    return findSeed(symbol)?.name ?? symbol;
  }

  /** Short trading name, for sentences rather than headers. */
  shortNameFor(symbol: string): string {
    return findSeed(symbol)?.shortName ?? findSeed(symbol)?.name ?? symbol;
  }

  currencyFor(symbol: string): string {
    return findSeed(symbol)?.currency ?? 'USD';
  }

  /** Every tradable symbol, used to pick believable peer mentions in generated research. */
  allSymbols(): readonly string[] {
    return SEEDS.map((seed) => seed.symbol);
  }

  isKnown(symbol: string): boolean {
    return !!findSeed(symbol);
  }

  private tick(seed: SymbolSeed): Quote {
    const state = this.live.get(seed.symbol) ?? this.seedState(seed);
    state.last = round2(state.last + (Math.random() - 0.5) * seed.prevClose * 0.0008);
    state.dayLow = Math.min(state.dayLow, state.last);
    state.dayHigh = Math.max(state.dayHigh, state.last);
    state.volume += randomInt(1_000, 8_000);
    this.live.set(seed.symbol, state);

    const change = round2(state.last - seed.prevClose);
    return {
      ...toSummary(seed),
      last: state.last,
      change,
      changePercent: round2((change / seed.prevClose) * 100),
      bid: round2(state.last - 0.01),
      bidSize: randomInt(50, 500) * 100,
      ask: round2(state.last + 0.01),
      askSize: randomInt(50, 500) * 100,
      volume: state.volume,
      open: seed.open,
      dayLow: state.dayLow,
      dayHigh: state.dayHigh,
      yearLow: seed.yearLow,
      yearHigh: seed.yearHigh,
      asOf: new Date(),
    };
  }

  private seedState(seed: SymbolSeed): LiveState {
    return {
      last: seed.open,
      dayLow: round2(seed.open * 0.991),
      dayHigh: round2(seed.open * 1.016),
      volume: seed.volume,
    };
  }
}

function findSeed(symbol: string): SymbolSeed | undefined {
  return SEEDS.find((seed) => seed.symbol === symbol.trim().toUpperCase());
}

function toSummary(seed: SymbolSeed): SymbolSummary {
  const { symbol, name, currency, region, fractional } = seed;
  return { symbol, name, currency, region, fractional };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}
