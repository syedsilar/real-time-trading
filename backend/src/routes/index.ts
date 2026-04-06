import { Router, Request, Response } from 'express';
import { MarketDataService } from '../services/MarketDataService';
import { HistoricalDataService } from '../services/HistoricalDataService';
import { TimeRange } from '../types';

const VALID_RANGES = new Set<TimeRange>(['1D', '1W', '1M', '3M']);

export function createRouter(
  marketData: MarketDataService,
  historicalData: HistoricalDataService,
): Router {
  const router = Router();

  router.get('/tickers', (_req: Request, res: Response) => {
    const tickers = marketData.getTickers().map((t) => ({
      symbol: t.symbol,
      name: t.name,
      exchange: t.exchange,
    }));
    res.json({ tickers });
  });

  router.get('/tickers/:symbol', (req: Request, res: Response) => {
    const symbol = req.params.symbol.toUpperCase();
    const price = marketData.getCurrentPrice(symbol);
    if (!price) {
      res.status(404).json({ error: `Ticker '${symbol}' not found` });
      return;
    }
    res.json(price);
  });

  router.get('/tickers/:symbol/history', (req: Request, res: Response) => {
    const symbol = req.params.symbol.toUpperCase();
    const range = (req.query.range as TimeRange) || '1D';

    if (!VALID_RANGES.has(range)) {
      res.status(400).json({ error: `Invalid range. Must be one of: ${[...VALID_RANGES].join(', ')}` });
      return;
    }

    const data = historicalData.getHistory(symbol, range);
    if (!data) {
      res.status(404).json({ error: `Ticker '${symbol}' not found` });
      return;
    }

    res.json({ symbol, range, data });
  });

  router.get('/snapshot', (_req: Request, res: Response) => {
    res.json({ prices: marketData.getSnapshot() });
  });

  router.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  return router;
}
