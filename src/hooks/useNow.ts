import { useEffect, useState } from 'react';

// Ticks every second so countdown timers / clocks stay live, mirroring the
// prototype's setInterval(now) loop.
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
