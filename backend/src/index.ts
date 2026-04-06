import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';

import { MarketDataService } from './services/MarketDataService';
import { HistoricalDataService } from './services/HistoricalDataService';
import { WebSocketHandler } from './websocket/WebSocketHandler';
import { createRouter } from './routes';

const PORT = parseInt(process.env.PORT || '3001', 10);

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'OPTIONS'],
}));
app.use(express.json());

const marketData = new MarketDataService();
const historicalData = new HistoricalDataService();

app.use('/api', createRouter(marketData, historicalData));

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });
new WebSocketHandler(wss, marketData);

marketData.start();

server.listen(PORT, () => {
  console.log(`[server] HTTP  → http://localhost:${PORT}/api`);
  console.log(`[server] WS    → ws://localhost:${PORT}/ws`);
});

function shutdown() {
  console.log('\n[server] Shutting down...');
  marketData.stop();
  server.close(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export { app, server };
