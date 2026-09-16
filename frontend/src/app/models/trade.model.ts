import { Transaction } from './account.model';

export type OrderSide = 'buy' | 'sell';

export type OrderPriceType = 'market' | 'limit' | 'stop' | 'trailing-stop-limit';

export type OrderExpiry = 'day' | 'custom';

/** Which panel the trade rail is currently showing. `null` means the rail is collapsed. */
export type TradePanel = 'stocks' | 'positions' | 'watchlist';

export interface SymbolSummary {
  symbol: string;
  name: string;
  currency: string;
  region: 'US' | 'CA';
  /** Whether the security supports fractional share quantities. */
  fractional: boolean;
}

export interface Quote extends SymbolSummary {
  last: number;
  change: number;
  changePercent: number;
  bid: number;
  bidSize: number;
  ask: number;
  askSize: number;
  volume: number;
  open: number;
  dayLow: number;
  dayHigh: number;
  yearLow: number;
  yearHigh: number;
  asOf: Date;
}

/** A fully validated ticket, frozen at the moment the user hits Review. */
export interface OrderDraft {
  side: OrderSide;
  symbol: string;
  name: string;
  currency: string;
  priceType: OrderPriceType;
  shares: number;
  fractional: boolean;
  estimatedPrice: number;
  limitPrice: number | null;
  stopPrice: number | null;
  trailingAmount: number | null;
  expiry: OrderExpiry;
  expiryDate: string | null;
  accountId: number;
  accountLabel: string;
  buyingPower: number;
  estimatedValue: number;
  commission: number;
  estimatedTotal: number;
  /** Shares already held in the funding account before this order. */
  positionBefore: number;
}

export interface Position {
  id: number;
  accountId: number;
  accountName: string;
  accountNumber: string;
  symbol: string;
  name: string;
  currency: string;
  quantity: number;
  averageCost: number;
  costBasis: number;
}

export interface PlaceOrderRequest {
  accountId: number;
  symbol: string;
  name: string;
  currency: string;
  side: OrderSide;
  quantity: number;
  price: number;
  priceType: OrderPriceType;
}

/** What the server reports back once an order has settled. */
export interface OrderResult {
  confirmationNumber: string;
  placedAt: string;
  side: OrderSide;
  symbol: string;
  quantity: number;
  price: number;
  grossAmount: number;
  commission: number;
  netAmount: number;
  transaction: Transaction;
  /** Null when a sell closed the holding. */
  position: Position | null;
}

export interface PlacedOrder {
  draft: OrderDraft;
  result: OrderResult;
}

export const ORDER_PRICE_TYPES: readonly { value: OrderPriceType; label: string }[] = [
  { value: 'market', label: 'Market' },
  { value: 'limit', label: 'Limit' },
  { value: 'stop', label: 'Stop' },
  { value: 'trailing-stop-limit', label: 'Trailing stop limit' },
];

export const REGION_FLAGS: Record<SymbolSummary['region'], string> = {
  US: '🇺🇸',
  CA: '🇨🇦',
};

/** Zero-commission online equity trading, mirrored in the review modal. */
export const COMMISSION = 0;
