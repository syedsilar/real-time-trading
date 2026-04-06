import { MarketDataService, TICKERS } from '../src/services/MarketDataService';

describe('MarketDataService', () => {
  let service: MarketDataService;

  beforeEach(() => {
    service = new MarketDataService();
  });

  afterEach(() => {
    service.stop();
  });

  describe('getTickers()', () => {
    it('returns all configured tickers', () => {
      const tickers = service.getTickers();
      expect(tickers).toHaveLength(TICKERS.length);
      expect(tickers.map((t) => t.symbol)).toContain('AAPL');
      expect(tickers.map((t) => t.symbol)).toContain('BTC-USD');
    });

    it('each ticker has required fields', () => {
      service.getTickers().forEach((t) => {
        expect(t.symbol).toBeTruthy();
        expect(t.name).toBeTruthy();
        expect(t.exchange).toBeTruthy();
        expect(t.basePrice).toBeGreaterThan(0);
      });
    });
  });

  describe('getSnapshot()', () => {
    it('returns a price update for every ticker', () => {
      const snapshot = service.getSnapshot();
      expect(snapshot).toHaveLength(TICKERS.length);
    });

    it('each price update has valid numeric fields', () => {
      service.getSnapshot().forEach((update) => {
        expect(typeof update.price).toBe('number');
        expect(update.price).toBeGreaterThan(0);
        expect(typeof update.volume).toBe('number');
        expect(update.volume).toBeGreaterThanOrEqual(0);
        expect(typeof update.changePercent).toBe('number');
        expect(typeof update.timestamp).toBe('number');
      });
    });

    it('high >= price >= low', () => {
      service.getSnapshot().forEach((update) => {
        expect(update.high).toBeGreaterThanOrEqual(update.price);
        expect(update.price).toBeGreaterThanOrEqual(update.low);
      });
    });
  });

  describe('getCurrentPrice()', () => {
    it('returns null for unknown symbol', () => {
      expect(service.getCurrentPrice('INVALID')).toBeNull();
    });

    it('returns correct symbol', () => {
      const update = service.getCurrentPrice('AAPL');
      expect(update).not.toBeNull();
      expect(update!.symbol).toBe('AAPL');
    });

    it('price is within reasonable range of base price', () => {
      const aaplBase = TICKERS.find((t) => t.symbol === 'AAPL')!.basePrice;
      const update = service.getCurrentPrice('AAPL')!;
      // Price should be within 70%–130% of base (right after init)
      expect(update.price).toBeGreaterThan(aaplBase * 0.7);
      expect(update.price).toBeLessThan(aaplBase * 1.3);
    });
  });

  describe('price simulation', () => {
    it('emits update events when started', (done) => {
      service.once('update', (updates) => {
        expect(Array.isArray(updates)).toBe(true);
        expect(updates.length).toBe(TICKERS.length);
        done();
      });
      service.start();
    }, 3000);

    it('does not emit after stop()', (done) => {
      let count = 0;
      service.on('update', () => count++);
      service.start();

      setTimeout(() => {
        service.stop();
        const countAfterStop = count;

        setTimeout(() => {
          expect(count).toBe(countAfterStop);
          done();
        }, 1500);
      }, 1500);
    }, 6000);

    it('calling start() twice does not double-fire events', (done) => {
      let count = 0;
      service.on('update', () => count++);
      service.start();
      service.start(); // should be a no-op

      setTimeout(() => {
        service.stop();
        // Should have fired ~1-2 times, not doubled
        expect(count).toBeLessThanOrEqual(3);
        done();
      }, 2500);
    }, 5000);
  });
});
