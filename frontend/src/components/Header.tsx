import React from 'react';
import { WSStatus } from '../hooks/useWebSocket';

interface HeaderProps {
  wsStatus: WSStatus;
  tickerCount: number;
  alertCount: number;
}

const STATUS_LABEL: Record<WSStatus, string> = {
  connecting: 'Connecting…',
  connected: 'Live',
  disconnected: 'Reconnecting…',
  error: 'Error',
};

const STATUS_CLASS: Record<WSStatus, string> = {
  connecting: 'status-connecting',
  connected: 'status-connected',
  disconnected: 'status-disconnected',
  error: 'status-error',
};

export const Header: React.FC<HeaderProps> = ({ wsStatus, tickerCount, alertCount }) => {
  const now = new Date().toLocaleTimeString('en-US', { hour12: false });

  return (
    <header className="header">
      <div className="header-left">
        <span className="header-logo">📈</span>
        <h1 className="header-title">Trading Dashboard</h1>
      </div>

      <div className="header-right">
        <span className="header-meta">{tickerCount} instruments</span>
        {alertCount > 0 && (
          <span className="header-alerts-badge">{alertCount} alerts</span>
        )}
        <div className={`ws-status ${STATUS_CLASS[wsStatus]}`}>
          <span className="ws-dot" />
          {STATUS_LABEL[wsStatus]}
        </div>
        <span className="header-time">{now}</span>
      </div>
    </header>
  );
};
