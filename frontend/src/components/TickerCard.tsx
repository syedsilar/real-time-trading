import React from 'react';
import { PriceUpdate, Ticker } from '../types';

interface TickerCardProps {
  ticker: Ticker;
  update: PriceUpdate | undefined;
  isSelected: boolean;
  onSelect: (symbol: string) => void;
}

function formatPrice(price: number, symbol: string): string {
  if (symbol === 'BTC-USD') return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (symbol === 'ETH-USD') return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatVolume(volume: number): string {
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(1)}M`;
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(0)}K`;
  return volume.toString();
}

export const TickerCard: React.FC<TickerCardProps> = ({ ticker, update, isSelected, onSelect }) => {
  const isPositive = (update?.changePercent ?? 0) >= 0;
  const changeClass = isPositive ? 'positive' : 'negative';

  return (
    <button
      className={`ticker-card ${isSelected ? 'selected' : ''} ${update ? changeClass + '-border' : ''}`}
      onClick={() => onSelect(ticker.symbol)}
      aria-label={`Select ${ticker.name}`}
      aria-pressed={isSelected}
    >
      <div className="ticker-card-top">
        <div>
          <span className="ticker-symbol">{ticker.symbol}</span>
          <span className="ticker-exchange">{ticker.exchange}</span>
        </div>
        {update && (
          <span className={`ticker-badge ${changeClass}`}>
            {isPositive ? '▲' : '▼'} {Math.abs(update.changePercent).toFixed(2)}%
          </span>
        )}
      </div>

      <div className="ticker-card-bottom">
        {update ? (
          <>
            <span className="ticker-price">${formatPrice(update.price, ticker.symbol)}</span>
            <span className={`ticker-change ${changeClass}`}>
              {isPositive ? '+' : ''}{update.change.toFixed(2)}
            </span>
          </>
        ) : (
          <span className="ticker-loading">Loading…</span>
        )}
      </div>

      {update && (
        <div className="ticker-card-meta">
          <span>H: ${formatPrice(update.high, ticker.symbol)}</span>
          <span>L: ${formatPrice(update.low, ticker.symbol)}</span>
          <span>Vol: {formatVolume(update.volume)}</span>
        </div>
      )}

      <div className="ticker-name">{ticker.name}</div>
    </button>
  );
};
