import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { TickerList } from './components/TickerList';
import { PriceChart } from './components/PriceChart';
import { AlertPanel } from './components/AlertPanel';
import { useWebSocket } from './hooks/useWebSocket';
import { usePriceAlerts } from './hooks/usePriceAlerts';
import { Ticker, PriceUpdate, WSMessage } from './types';
import './styles/index.css';

export default function App() {
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [prices, setPrices] = useState<Map<string, PriceUpdate>>(new Map());
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [tickerError, setTickerError] = useState<string | null>(null);

  const { alerts, triggered, addAlert, removeAlert, dismissTriggered, clearAll, checkAlerts } =
    usePriceAlerts();

  // Keep a ref to checkAlerts to avoid stale closure in ws handler
  const checkAlertsRef = useRef(checkAlerts);
  checkAlertsRef.current = checkAlerts;

  const handleMessage = useCallback((msg: WSMessage) => {
    if (msg.type === 'snapshot' || msg.type === 'price_update') {
      const updates = msg.data as PriceUpdate[];
      setPrices((prev) => {
        const next = new Map(prev);
        updates.forEach((u) => next.set(u.symbol, u));
        return next;
      });
      checkAlertsRef.current(updates);
    }
  }, []);

  const { status } = useWebSocket({ onMessage: handleMessage });

  // Fetch ticker list from REST API once on mount
  useEffect(() => {
    fetch('/api/tickers')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(({ tickers: list }: { tickers: Ticker[] }) => {
        setTickers(list);
        setSelectedSymbol(list[0]?.symbol ?? '');
      })
      .catch(() => setTickerError('Failed to load tickers. Is the backend running?'));
  }, []);

  const selectedTicker = tickers.find((t) => t.symbol === selectedSymbol);
  const selectedPrice = prices.get(selectedSymbol);

  return (
    <div className="app">
      <Header
        wsStatus={status}
        tickerCount={tickers.length}
        alertCount={alerts.length + triggered.length}
      />

      {tickerError && <div className="error-banner">{tickerError}</div>}

      <main className="app-body">
        <TickerList
          tickers={tickers}
          prices={prices}
          selectedSymbol={selectedSymbol}
          onSelect={setSelectedSymbol}
        />

        <section className="chart-section">
          <PriceChart ticker={selectedTicker} liveUpdate={selectedPrice} />
        </section>

        <AlertPanel
          tickers={tickers}
          alerts={alerts}
          triggered={triggered}
          onAddAlert={addAlert}
          onRemoveAlert={removeAlert}
          onDismissTriggered={dismissTriggered}
          onClearAll={clearAll}
        />
      </main>
    </div>
  );
}
