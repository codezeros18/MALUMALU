import { useEffect } from 'react';
import { flushWaOutbox } from '../lib/waOutbox';
import { useOnlineStatus } from './useOnlineStatus';

/** Drains the WhatsApp outbox whenever the device comes back online. */
export function useWaFlush(): void {
  const online = useOnlineStatus();

  useEffect(() => {
    if (!online) return;
    flushWaOutbox().catch(e => console.error('useWaFlush', e));
  }, [online]);
}
