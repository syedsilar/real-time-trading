import React from 'react';
import { Ticker, PriceUpdate } from '../types';
import { TickerCard } from './TickerCard';

interface TickerListProps {
  tickers: Ticker[];
  prices: Map<string, PriceUpdate>;
  selectedSymbol: string;
  onSelect: (symbol: string) => void;
}

export const TickerList: React.FC<TickerListProps> = ({
  tickers,
  prices,
  selectedSymbol,
  onSelect,
}) => {
  return (
    <aside className="ticker-list">
      <div className="ticker-list-header">
        <h2>Markets</h2>
        <span className="ticker-list-count">{tickers.length}</span>
      </div>
      <div className="ticker-list-items">
        {tickers.map((ticker) => (
          <TickerCard
            key={ticker.symbol}
            ticker={ticker}
            update={prices.get(ticker.symbol)}
            isSelected={ticker.symbol === selectedSymbol}
            onSelect={onSelect}
          />
        ))}
      </div>
    </aside>
  );
};
