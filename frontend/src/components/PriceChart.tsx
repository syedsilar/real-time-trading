import React, { useState, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { Ticker, PriceUpdate, HistoricalDataPoint, TimeRange } from '../types';

interface ChartDataPoint {
  time: string;
  price: number;
  volume: number;
  timestamp: number;
}

interface PriceChartProps {
  ticker: Ticker | undefined;
  liveUpdate: PriceUpdate | undefined;
}

const TIME_RANGES: TimeRange[] = ['1D', '1W', '1M', '3M'];

function formatTimestamp(ts: number, range: TimeRange): string {
  const d = new Date(ts);
  if (range === '1D') return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  if (range === '1W') return d.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit', hour12: false });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatYAxis(value: number): string {
  if (value >= 10_000) return `$${(value / 1000).toFixed(0)}k`;
  if (value >= 1000) return `$${value.toFixed(0)}`;
  return `$${value.toFixed(2)}`;
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const price: number = payload[0]?.value;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-time">{label}</div>
      <div className="chart-tooltip-price">${price?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
    </div>
  );
};

export const PriceChart: React.FC<PriceChartProps> = ({ ticker, liveUpdate }) => {
  const [range, setRange] = useState<TimeRange>('1D');
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [livePoints, setLivePoints] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (symbol: string, r: TimeRange) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tickers/${symbol}/history?range=${r}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setHistoricalData(json.data || []);
      setLivePoints([]); // reset live points when switching
    } catch (e) {
      setError('Failed to load historical data');
      setHistoricalData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ticker) fetchHistory(ticker.symbol, range);
  }, [ticker, range, fetchHistory]);

  // Append live updates to the chart
  useEffect(() => {
    if (!liveUpdate || range !== '1D') return;
    setLivePoints((prev) => {
      const point: ChartDataPoint = {
        time: formatTimestamp(liveUpdate.timestamp, range),
        price: liveUpdate.price,
        volume: liveUpdate.volume,
        timestamp: liveUpdate.timestamp,
      };
      // Keep last 60 live points
      const updated = [...prev, point].slice(-60);
      return updated;
    });
  }, [liveUpdate, range]);

  const chartData: ChartDataPoint[] = historicalData
    .map((d) => ({
      time: formatTimestamp(d.timestamp, range),
      price: d.close,
      volume: d.volume,
      timestamp: d.timestamp,
    }))
    .concat(livePoints)
    .slice(-400); // cap at 400 visible points

  const prices = chartData.map((d) => d.price);
  const minPrice = prices.length ? Math.min(...prices) * 0.999 : 0;
  const maxPrice = prices.length ? Math.max(...prices) * 1.001 : 100;
  const openPrice = liveUpdate?.open;

  const isPositive = liveUpdate ? liveUpdate.changePercent >= 0 : true;
  const strokeColor = isPositive ? '#22c55e' : '#ef4444';
  const fillColor = isPositive ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)';

  if (!ticker) {
    return (
      <div className="chart-container chart-empty">
        <span>Select a ticker to view its chart</span>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <div className="chart-header">
        <div className="chart-title-group">
          <h2 className="chart-symbol">{ticker.symbol}</h2>
          <span className="chart-name">{ticker.name}</span>
        </div>
        {liveUpdate && (
          <div className="chart-price-summary">
            <span className="chart-current-price">
              ${liveUpdate.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span className={`chart-change ${isPositive ? 'positive' : 'negative'}`}>
              {isPositive ? '+' : ''}{liveUpdate.change.toFixed(2)} ({isPositive ? '+' : ''}{liveUpdate.changePercent.toFixed(2)}%)
            </span>
          </div>
        )}
        <div className="chart-range-buttons">
          {TIME_RANGES.map((r) => (
            <button
              key={r}
              className={`range-btn ${range === r ? 'active' : ''}`}
              onClick={() => setRange(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="chart-loading">
          <div className="chart-spinner" />
          <span>Loading chart data…</span>
        </div>
      ) : error ? (
        <div className="chart-error">{error}</div>
      ) : (
        <ResponsiveContainer width="100%" height={340}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="time"
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[minPrice, maxPrice]}
              tickFormatter={formatYAxis}
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={70}
            />
            <Tooltip content={<CustomTooltip />} />
            {openPrice && (
              <ReferenceLine
                y={openPrice}
                stroke="rgba(255,255,255,0.2)"
                strokeDasharray="4 4"
                label={{ value: 'Open', fill: '#9ca3af', fontSize: 11, position: 'insideTopRight' }}
              />
            )}
            <Area
              type="monotone"
              dataKey="price"
              stroke={strokeColor}
              strokeWidth={2}
              fill="url(#priceGradient)"
              dot={false}
              activeDot={{ r: 4, fill: strokeColor }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {liveUpdate && (
        <div className="chart-stats-row">
          <div className="chart-stat">
            <span className="stat-label">Open</span>
            <span className="stat-value">${liveUpdate.open.toFixed(2)}</span>
          </div>
          <div className="chart-stat">
            <span className="stat-label">High</span>
            <span className="stat-value positive">${liveUpdate.high.toFixed(2)}</span>
          </div>
          <div className="chart-stat">
            <span className="stat-label">Low</span>
            <span className="stat-value negative">${liveUpdate.low.toFixed(2)}</span>
          </div>
          <div className="chart-stat">
            <span className="stat-label">Volume</span>
            <span className="stat-value">
              {liveUpdate.volume >= 1_000_000
                ? `${(liveUpdate.volume / 1_000_000).toFixed(2)}M`
                : `${(liveUpdate.volume / 1_000).toFixed(0)}K`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
