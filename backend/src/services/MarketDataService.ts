import { EventEmitter } from 'events';
import { PriceUpdate, Ticker } from '../types';

export const TICKERS: Ticker[] = [
  { symbol: 'AAPL',    name: 'Apple Inc.',          exchange: 'NASDAQ', basePrice: 178.50 },
  { symbol: 'TSLA',    name: 'Tesla Inc.',           exchange: 'NASDAQ', basePrice: 245.00 },
  { symbol: 'GOOGL',   name: 'Alphabet Inc.',        exchange: 'NASDAQ', basePrice: 141.80 },
  { symbol: 'MSFT',    name: 'Microsoft Corp.',      exchange: 'NASDAQ', basePrice: 415.20 },
  { symbol: 'AMZN',    name: 'Amazon.com Inc.',      exchange: 'NASDAQ', basePrice: 185.60 },
  { symbol: 'BTC-USD', name: 'Bitcoin / USD',        exchange: 'CRYPTO', basePrice: 67500.00 },
  { symbol: 'ETH-USD', name: 'Ethereum / USD',       exchange: 'CRYPTO', basePrice: 3540.00 },
  { symbol: 'NVDA',    name: 'NVIDIA Corp.',         exchange: 'NASDAQ', basePrice: 875.00 },
  { symbol: 'META',    name: 'Meta Platforms Inc.',  exchange: 'NASDAQ', basePrice: 505.00 },
  { symbol: 'SPY',     name: 'SPDR S&P 500 ETF',    exchange: 'NYSE',   basePrice: 520.00 },
];

interface PriceState {
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  velocity: number;
}

export class MarketDataService extends EventEmitter {
  private priceStates: Map<string, PriceState> = new Map();
  private intervalId: NodeJS.Timeout | null = null;
  private readonly UPDATE_INTERVAL_MS = 1000;

  constructor() {
    super();
    this.initializePrices();
  }

  private initializePrices(): void {
    for (const ticker of TICKERS) {
      this.priceStates.set(ticker.symbol, {
        price: ticker.basePrice,
        open: ticker.basePrice,
        high: ticker.basePrice,
        low: ticker.basePrice,
        volume: this.randomInt(500_000, 5_000_000),
        velocity: 0,
      });
    }
  }

  private nextPrice(symbol: string, state: PriceState): PriceState {
    const ticker = TICKERS.find((t) => t.symbol === symbol)!;

    const isCrypto = ticker.exchange === 'CRYPTO';
    const volatility = isCrypto ? 0.004 : 0.0015;

    const shock = (Math.random() - 0.5) * 2 * volatility * state.price;

    const meanReversionStrength = 0.005;
    const meanReversion = (ticker.basePrice - state.price) * meanReversionStrength;

    const newVelocity = state.velocity * 0.3 + shock + meanReversion;
    const newPrice = Math.max(state.price + newVelocity, ticker.basePrice * 0.3);

    return {
      price: parseFloat(newPrice.toFixed(isCrypto ? 2 : 4)),
      open: state.open,
      high: Math.max(state.high, newPrice),
      low: Math.min(state.low, newPrice),
      volume: state.volume + this.randomInt(100, 5000),
      velocity: newVelocity,
    };
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  start(): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.tick(), this.UPDATE_INTERVAL_MS);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private tick(): void {
    const updates: PriceUpdate[] = [];

    for (const [symbol, state] of this.priceStates) {
      const newState = this.nextPrice(symbol, state);
      this.priceStates.set(symbol, newState);

      const change = newState.price - newState.open;
      const changePercent = (change / newState.open) * 100;

      updates.push({
        symbol,
        price: newState.price,
        open: newState.open,
        change: parseFloat(change.toFixed(4)),
        changePercent: parseFloat(changePercent.toFixed(3)),
        volume: newState.volume,
        high: parseFloat(newState.high.toFixed(4)),
        low: parseFloat(newState.low.toFixed(4)),
        timestamp: Date.now(),
      });
    }

    this.emit('update', updates);
  }

  getSnapshot(): PriceUpdate[] {
    const snapshot: PriceUpdate[] = [];
    for (const [symbol, state] of this.priceStates) {
      const change = state.price - state.open;
      snapshot.push({
        symbol,
        price: state.price,
        open: state.open,
        change: parseFloat(change.toFixed(4)),
        changePercent: parseFloat(((change / state.open) * 100).toFixed(3)),
        volume: state.volume,
        high: parseFloat(state.high.toFixed(4)),
        low: parseFloat(state.low.toFixed(4)),
        timestamp: Date.now(),
      });
    }
    return snapshot;
  }

  getCurrentPrice(symbol: string): PriceUpdate | null {
    const state = this.priceStates.get(symbol);
    if (!state) return null;
    const change = state.price - state.open;
    return {
      symbol,
      price: state.price,
      open: state.open,
      change: parseFloat(change.toFixed(4)),
      changePercent: parseFloat(((change / state.open) * 100).toFixed(3)),
      volume: state.volume,
      high: parseFloat(state.high.toFixed(4)),
      low: parseFloat(state.low.toFixed(4)),
      timestamp: Date.now(),
    };
  }

  getTickers(): Ticker[] {
    return TICKERS;
  }
}
