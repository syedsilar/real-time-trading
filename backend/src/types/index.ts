export interface Ticker {
  symbol: string;
  name: string;
  exchange: string;
  basePrice: number;
}

export interface PriceUpdate {
  symbol: string;
  price: number;
  open: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  timestamp: number;
}

export interface HistoricalDataPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type TimeRange = '1D' | '1W' | '1M' | '3M';

export type WSMessageType =
  | 'subscribe'
  | 'unsubscribe'
  | 'price_update'
  | 'snapshot'
  | 'error'
  | 'alert_triggered';

export interface WSClientMessage {
  type: 'subscribe' | 'unsubscribe';
  symbols: string[];
}

export interface WSServerMessage {
  type: WSMessageType;
  data?: PriceUpdate | PriceUpdate[];
  message?: string;
  symbol?: string;
  threshold?: number;
}
