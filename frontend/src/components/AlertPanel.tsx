import React, { useState } from 'react';
import { PriceAlert, TriggeredAlert, Ticker } from '../types';

interface AlertPanelProps {
  tickers: Ticker[];
  alerts: PriceAlert[];
  triggered: TriggeredAlert[];
  onAddAlert: (symbol: string, type: 'above' | 'below', threshold: number) => void;
  onRemoveAlert: (id: string) => void;
  onDismissTriggered: (id: string) => void;
  onClearAll: () => void;
}

export const AlertPanel: React.FC<AlertPanelProps> = ({
  tickers,
  alerts,
  triggered,
  onAddAlert,
  onRemoveAlert,
  onDismissTriggered,
  onClearAll,
}) => {
  const [symbol, setSymbol] = useState(tickers[0]?.symbol ?? '');
  const [type, setType] = useState<'above' | 'below'>('above');
  const [threshold, setThreshold] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(threshold);
    if (isNaN(value) || value <= 0) {
      setFormError('Enter a valid positive price');
      return;
    }
    setFormError('');
    onAddAlert(symbol, type, value);
    setThreshold('');
  };

  return (
    <aside className="alert-panel">
      <div className="alert-panel-header">
        <h2>Price Alerts</h2>
        {triggered.length > 0 && (
          <button className="btn-ghost btn-sm" onClick={onClearAll}>
            Clear all
          </button>
        )}
      </div>

      {/* Add alert form */}
      <form className="alert-form" onSubmit={handleSubmit}>
        <select
          className="alert-select"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          aria-label="Ticker symbol"
        >
          {tickers.map((t) => (
            <option key={t.symbol} value={t.symbol}>
              {t.symbol}
            </option>
          ))}
        </select>

        <select
          className="alert-select"
          value={type}
          onChange={(e) => setType(e.target.value as 'above' | 'below')}
          aria-label="Alert type"
        >
          <option value="above">Above</option>
          <option value="below">Below</option>
        </select>

        <input
          className="alert-input"
          type="number"
          placeholder="Price"
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
          min="0"
          step="any"
          aria-label="Alert threshold"
        />

        <button className="btn-primary btn-sm" type="submit">
          + Set
        </button>

        {formError && <span className="alert-form-error">{formError}</span>}
      </form>

      {/* Triggered alerts */}
      {triggered.length > 0 && (
        <section className="alert-section">
          <h3 className="alert-section-title triggered-title">
            Triggered <span className="badge-red">{triggered.length}</span>
          </h3>
          <ul className="alert-list">
            {triggered.map((a) => (
              <li key={a.id} className="alert-item triggered-item">
                <div className="alert-item-main">
                  <span className="alert-symbol">{a.symbol}</span>
                  <span className="alert-desc">
                    {a.type === 'above' ? '▲ Above' : '▼ Below'} ${a.threshold.toLocaleString()}
                  </span>
                  <span className="alert-triggered-price">
                    Hit: ${a.triggeredPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <button
                  className="alert-dismiss"
                  onClick={() => onDismissTriggered(a.id)}
                  aria-label="Dismiss alert"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Pending alerts */}
      <section className="alert-section">
        <h3 className="alert-section-title">
          Pending <span className="badge-gray">{alerts.length}</span>
        </h3>
        {alerts.length === 0 ? (
          <p className="alert-empty">No active alerts. Set one above.</p>
        ) : (
          <ul className="alert-list">
            {alerts.map((a) => (
              <li key={a.id} className="alert-item">
                <div className="alert-item-main">
                  <span className="alert-symbol">{a.symbol}</span>
                  <span className="alert-desc">
                    {a.type === 'above' ? '▲ Above' : '▼ Below'} ${a.threshold.toLocaleString()}
                  </span>
                </div>
                <button
                  className="alert-dismiss"
                  onClick={() => onRemoveAlert(a.id)}
                  aria-label="Remove alert"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
};
