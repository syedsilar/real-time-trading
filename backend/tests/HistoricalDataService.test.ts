import { HistoricalDataService } from '../src/services/HistoricalDataService';
import { TimeRange } from '../src/types';

describe('HistoricalDataService', () => {
  let service: HistoricalDataService;

  beforeEach(() => {
    service = new HistoricalDataService();
  });

  describe('getHistory()', () => {
    it('returns null for unknown symbol', () => {
      expect(service.getHistory('INVALID')).toBeNull();
    });

    it('returns data array for valid symbol', () => {
      const data = service.getHistory('AAPL', '1D');
      expect(data).not.toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expect(data!.length).toBeGreaterThan(0);
    });

    const ranges: TimeRange[] = ['1D', '1W', '1M', '3M'];
    ranges.forEach((range) => {
      it(`returns correct point count for range ${range}`, () => {
        const expectedCounts: Record<TimeRange, number> = {
          '1D': 390,
          '1W': 168,
          '1M': 120,
          '3M': 90,
        };
        const data = service.getHistory('TSLA', range);
        expect(data).not.toBeNull();
        expect(data!.length).toBe(expectedCounts[range]);
      });
    });

    it('each candle has valid OHLCV structure', () => {
      const data = service.getHistory('MSFT', '1D')!;
      data.forEach((candle) => {
        expect(typeof candle.timestamp).toBe('number');
        expect(candle.high).toBeGreaterThanOrEqual(candle.open);
        expect(candle.high).toBeGreaterThanOrEqual(candle.close);
        expect(candle.low).toBeLessThanOrEqual(candle.open);
        expect(candle.low).toBeLessThanOrEqual(candle.close);
        expect(candle.volume).toBeGreaterThan(0);
        expect(candle.open).toBeGreaterThan(0);
        expect(candle.close).toBeGreaterThan(0);
      });
    });

    it('timestamps are in ascending order', () => {
      const data = service.getHistory('GOOGL', '1W')!;
      for (let i = 1; i < data.length; i++) {
        expect(data[i].timestamp).toBeGreaterThan(data[i - 1].timestamp);
      }
    });

    it('also returns data for crypto tickers', () => {
      const btcData = service.getHistory('BTC-USD', '1D');
      expect(btcData).not.toBeNull();
      expect(btcData!.length).toBe(390);
    });
  });

  describe('caching', () => {
    it('returns the same object on a second call (cache hit)', () => {
      const first = service.getHistory('AAPL', '1D');
      const second = service.getHistory('AAPL', '1D');
      expect(first).toBe(second); // same reference
    });

    it('clearCache() removes cached entries for the given symbol', () => {
      service.getHistory('AAPL', '1D');
      service.clearCache('AAPL');
      expect(service.getCacheStats().keys.some((k) => k.startsWith('AAPL'))).toBe(false);
    });

    it('clearCache() with no argument clears all entries', () => {
      service.getHistory('AAPL', '1D');
      service.getHistory('TSLA', '1W');
      service.clearCache();
      expect(service.getCacheStats().size).toBe(0);
    });
  });
});
