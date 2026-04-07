export interface Ticker {
  symbol: string;
  name: string;
  exchange: string;
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

export interface PriceAlert {
  id: string;
  symbol: string;
  type: 'above' | 'below';
  threshold: number;
  createdAt: number;
}

export interface TriggeredAlert extends PriceAlert {
  triggeredAt: number;
  triggeredPrice: number;
}

export type WSMessage =
  | { type: 'snapshot'; data: PriceUpdate[] }
  | { type: 'price_update'; data: PriceUpdate[] }
  | { type: 'alert_triggered'; symbol: string; threshold: number; message: string; data: PriceUpdate }
  | { type: 'error'; message: string };
