import { HistoricalDataPoint, TimeRange } from '../types';
import { TICKERS } from './MarketDataService';

const RANGE_CONFIG: Record<TimeRange, { points: number; intervalMs: number }> = {
  '1D': { points: 390,   intervalMs: 60_000 },
  '1W': { points: 168,   intervalMs: 3_600_000 },
  '1M': { points: 120,   intervalMs: 21_600_000 },
  '3M': { points: 90,    intervalMs: 86_400_000 },
};

export class HistoricalDataService {
  private cache: Map<string, { data: HistoricalDataPoint[]; cachedAt: number }> = new Map();
  private readonly CACHE_TTL_MS = 60_000;

  getHistory(symbol: string, range: TimeRange = '1D'): HistoricalDataPoint[] | null {
    const ticker = TICKERS.find((t) => t.symbol === symbol);
    if (!ticker) return null;

    const cacheKey = `${symbol}:${range}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.cachedAt < this.CACHE_TTL_MS) {
      return cached.data;
    }

    const data = this.generate(ticker.basePrice, range);
    this.cache.set(cacheKey, { data, cachedAt: Date.now() });
    return data;
  }

  private generate(basePrice: number, range: TimeRange): HistoricalDataPoint[] {
    const { points, intervalMs } = RANGE_CONFIG[range];
    const now = Date.now();
    const startTs = now - points * intervalMs;

    const isCrypto = basePrice > 1000;
    const volatility = isCrypto ? 0.005 : 0.002;

    const candles: HistoricalDataPoint[] = [];
    let price = basePrice * (0.9 + Math.random() * 0.2);

    for (let i = 0; i < points; i++) {
      const ts = startTs + i * intervalMs;

      const openPrice = price;
      const candleMove = (Math.random() - 0.5) * 2 * volatility * price;
      const closePrice = Math.max(openPrice + candleMove, openPrice * 0.5);
      const wickRange = Math.abs(candleMove) * (0.5 + Math.random());

      const high = Math.max(openPrice, closePrice) + wickRange * Math.random();
      const low = Math.min(openPrice, closePrice) - wickRange * Math.random();
      const volume = Math.floor(500_000 + Math.random() * 4_500_000);

      candles.push({
        timestamp: ts,
        open: parseFloat(openPrice.toFixed(4)),
        high: parseFloat(high.toFixed(4)),
        low: parseFloat(Math.max(low, openPrice * 0.01).toFixed(4)),
        close: parseFloat(closePrice.toFixed(4)),
        volume,
      });

      price = closePrice;
    }

    return candles;
  }

  clearCache(symbol?: string): void {
    if (symbol) {
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${symbol}:`)) this.cache.delete(key);
      }
    } else {
      this.cache.clear();
    }
  }

  getCacheStats(): { size: number; keys: string[] } {
    return { size: this.cache.size, keys: Array.from(this.cache.keys()) };
  }
}
