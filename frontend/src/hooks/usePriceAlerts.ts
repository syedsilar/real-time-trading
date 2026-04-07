import { useState, useCallback } from 'react';
import { PriceAlert, TriggeredAlert, PriceUpdate } from '../types';

export function usePriceAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [triggered, setTriggered] = useState<TriggeredAlert[]>([]);

  const addAlert = useCallback((symbol: string, type: 'above' | 'below', threshold: number) => {
    const newAlert: PriceAlert = {
      id: `${symbol}-${type}-${threshold}-${Date.now()}`,
      symbol,
      type,
      threshold,
      createdAt: Date.now(),
    };
    setAlerts((prev) => [...prev, newAlert]);
  }, []);

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const dismissTriggered = useCallback((id: string) => {
    setTriggered((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setTriggered([]);
  }, []);

  const checkAlerts = useCallback((updates: PriceUpdate[]) => {
    setAlerts((prev) => {
      const remaining: PriceAlert[] = [];
      const newlyTriggered: TriggeredAlert[] = [];

      for (const alert of prev) {
        const update = updates.find((u) => u.symbol === alert.symbol);
        if (!update) {
          remaining.push(alert);
          continue;
        }

        const hit =
          (alert.type === 'above' && update.price >= alert.threshold) ||
          (alert.type === 'below' && update.price <= alert.threshold);

        if (hit) {
          newlyTriggered.push({
            ...alert,
            triggeredAt: Date.now(),
            triggeredPrice: update.price,
          });
        } else {
          remaining.push(alert);
        }
      }

      if (newlyTriggered.length > 0) {
        setTriggered((t) => [...newlyTriggered, ...t].slice(0, 20)); // keep last 20
      }

      return remaining;
    });
  }, []);

  return { alerts, triggered, addAlert, removeAlert, dismissTriggered, clearAll, checkAlerts };
}
