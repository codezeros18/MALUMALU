import { addWaOutbox, getWaOutbox, newId, updateWaOutbox } from './db';
import { isWaConfigured, officerChatId, sendText } from './waha';
import type { WaOutboxItem } from '../types';

export interface FlushResult {
  sent: number;
  failed: number;
}

/**
 * Queues a WhatsApp message for `chatId`, or the officer when omitted. Never
 * throws: a notification must not be able to fail the plot/consent write that
 * triggered it.
 */
export async function enqueueWa(text: string, chatId?: string): Promise<void> {
  try {
    const target = chatId ?? officerChatId();
    if (!isWaConfigured() || !target) return;
    await addWaOutbox({
      id: newId(),
      chatId: target,
      text,
      status: 'pending',
      attempts: 0,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error('waOutbox.enqueueWa', e);
  }
}

// Guards against overlapping flushes (a connectivity flap, or React
// re-invoking the effect) sending the same queued message twice.
let flushing = false;

export async function flushWaOutbox(): Promise<FlushResult> {
  if (flushing) return { sent: 0, failed: 0 };
  flushing = true;
  try {
    const queued = (await getWaOutbox()).filter(i => i.status !== 'sent');
    let sent = 0;
    let failed = 0;

    for (const item of queued) {
      const attempts = item.attempts + 1;
      try {
        await sendText(item.chatId, item.text);
        await updateWaOutbox({
          ...item,
          status: 'sent',
          attempts,
          sentAt: new Date().toISOString(),
        });
        sent++;
      } catch (e) {
        const next: WaOutboxItem = {
          ...item,
          status: 'failed',
          attempts,
          lastError: e instanceof Error ? e.message : String(e),
        };
        await updateWaOutbox(next);
        failed++;
      }
    }

    return { sent, failed };
  } finally {
    flushing = false;
  }
}
