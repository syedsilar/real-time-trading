import { WebSocketServer, WebSocket } from 'ws';
import { MarketDataService } from '../services/MarketDataService';
import { PriceUpdate, WSClientMessage, WSServerMessage } from '../types';

interface ClientState {
  ws: WebSocket;
  subscriptions: Set<string>;
  alerts: Map<string, { above?: number; below?: number }>;
}

export class WebSocketHandler {
  private clients: Map<WebSocket, ClientState> = new Map();

  constructor(
    private readonly wss: WebSocketServer,
    private readonly marketData: MarketDataService,
  ) {
    this.wss.on('connection', (ws) => this.onConnection(ws));
    this.marketData.on('update', (updates: PriceUpdate[]) => this.broadcast(updates));
  }

  private onConnection(ws: WebSocket): void {
    const state: ClientState = {
      ws,
      subscriptions: new Set(),
      alerts: new Map(),
    };
    this.clients.set(ws, state);

    const snapshot = this.marketData.getSnapshot();
    this.send(ws, { type: 'snapshot', data: snapshot });

    ws.on('message', (raw) => {
      try {
        const msg: WSClientMessage = JSON.parse(raw.toString());
        this.handleMessage(state, msg);
      } catch {
        this.send(ws, { type: 'error', message: 'Invalid JSON message' });
      }
    });

    ws.on('close', () => this.clients.delete(ws));
    ws.on('error', () => this.clients.delete(ws));
  }

  private handleMessage(state: ClientState, msg: WSClientMessage): void {
    const validSymbols = new Set(this.marketData.getTickers().map((t) => t.symbol));

    if (msg.type === 'subscribe') {
      const symbols = (msg.symbols || []).filter((s) => validSymbols.has(s));
      symbols.forEach((s) => state.subscriptions.add(s));

      if (symbols.length === 0) {
        this.send(state.ws, { type: 'error', message: 'No valid symbols provided' });
      }
    } else if (msg.type === 'unsubscribe') {
      (msg.symbols || []).forEach((s) => state.subscriptions.delete(s));
    }
  }

  private broadcast(updates: PriceUpdate[]): void {
    for (const [ws, state] of this.clients) {
      if (ws.readyState !== WebSocket.OPEN) continue;

      const relevant =
        state.subscriptions.size === 0
          ? updates
          : updates.filter((u) => state.subscriptions.has(u.symbol));

      if (relevant.length === 0) continue;

      this.send(ws, { type: 'price_update', data: relevant });

      for (const update of relevant) {
        const alert = state.alerts.get(update.symbol);
        if (!alert) continue;

        if (alert.above !== undefined && update.price >= alert.above) {
          this.send(ws, {
            type: 'alert_triggered',
            symbol: update.symbol,
            threshold: alert.above,
            message: `${update.symbol} crossed above ${alert.above}`,
            data: update,
          });
          state.alerts.delete(update.symbol);
        } else if (alert.below !== undefined && update.price <= alert.below) {
          this.send(ws, {
            type: 'alert_triggered',
            symbol: update.symbol,
            threshold: alert.below,
            message: `${update.symbol} dropped below ${alert.below}`,
            data: update,
          });
          state.alerts.delete(update.symbol);
        }
      }
    }
  }

  private send(ws: WebSocket, msg: WSServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  getConnectionCount(): number {
    return this.clients.size;
  }
}
