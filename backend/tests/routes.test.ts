import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { createRouter } from '../src/routes';
import { MarketDataService } from '../src/services/MarketDataService';
import { HistoricalDataService } from '../src/services/HistoricalDataService';

function buildApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  const marketData = new MarketDataService();
  const historical = new HistoricalDataService();
  app.use('/api', createRouter(marketData, historical));
  return { app, marketData };
}

describe('REST API routes', () => {
  let app: express.Express;
  let marketData: MarketDataService;

  beforeEach(() => {
    ({ app, marketData } = buildApp());
  });

  afterEach(() => {
    marketData.stop();
  });

  describe('GET /api/health', () => {
    it('returns 200 with status ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(typeof res.body.timestamp).toBe('number');
    });
  });

  describe('GET /api/tickers', () => {
    it('returns 200 with tickers array', async () => {
      const res = await request(app).get('/api/tickers');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.tickers)).toBe(true);
      expect(res.body.tickers.length).toBeGreaterThan(0);
    });

    it('each ticker has symbol, name, exchange', async () => {
      const res = await request(app).get('/api/tickers');
      res.body.tickers.forEach((t: any) => {
        expect(t.symbol).toBeTruthy();
        expect(t.name).toBeTruthy();
        expect(t.exchange).toBeTruthy();
      });
    });
  });

  describe('GET /api/tickers/:symbol', () => {
    it('returns price data for valid symbol', async () => {
      const res = await request(app).get('/api/tickers/AAPL');
      expect(res.status).toBe(200);
      expect(res.body.symbol).toBe('AAPL');
      expect(typeof res.body.price).toBe('number');
    });

    it('is case-insensitive', async () => {
      const res = await request(app).get('/api/tickers/aapl');
      expect(res.status).toBe(200);
      expect(res.body.symbol).toBe('AAPL');
    });

    it('returns 404 for unknown symbol', async () => {
      const res = await request(app).get('/api/tickers/UNKNOWN');
      expect(res.status).toBe(404);
      expect(res.body.error).toBeTruthy();
    });
  });

  describe('GET /api/tickers/:symbol/history', () => {
    it('returns historical data with default range', async () => {
      const res = await request(app).get('/api/tickers/AAPL/history');
      expect(res.status).toBe(200);
      expect(res.body.symbol).toBe('AAPL');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('accepts valid range query param', async () => {
      for (const range of ['1D', '1W', '1M', '3M']) {
        const res = await request(app).get(`/api/tickers/TSLA/history?range=${range}`);
        expect(res.status).toBe(200);
        expect(res.body.range).toBe(range);
      }
    });

    it('returns 400 for invalid range', async () => {
      const res = await request(app).get('/api/tickers/AAPL/history?range=INVALID');
      expect(res.status).toBe(400);
    });

    it('returns 404 for unknown symbol', async () => {
      const res = await request(app).get('/api/tickers/INVALID/history');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/snapshot', () => {
    it('returns prices for all tickers', async () => {
      const res = await request(app).get('/api/snapshot');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.prices)).toBe(true);
      expect(res.body.prices.length).toBeGreaterThan(0);
    });
  });
});
