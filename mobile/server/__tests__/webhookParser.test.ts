import { parseInboundWebhook, shouldRespond } from '../webhookParser';

describe('parseInboundWebhook', () => {
  it('extracts telepon (digits only) and body from a WAHA message event', () => {
    const payload = {
      event: 'message',
      session: 'default',
      payload: { from: '6281234567890@c.us', fromMe: false, body: 'harga kopi Pangalengan' },
    };
    expect(parseInboundWebhook(payload)).toEqual({ telepon: '6281234567890', body: 'harga kopi Pangalengan' });
  });

  it('ignores our own outgoing messages (fromMe: true) to avoid echo loops', () => {
    const payload = {
      event: 'message',
      payload: { from: '6281234567890@c.us', fromMe: true, body: 'harga kopi Pangalengan' },
    };
    expect(parseInboundWebhook(payload)).toBeNull();
  });

  it('ignores non-message events', () => {
    const payload = { event: 'session.status', payload: { from: '6281234567890@c.us', fromMe: false, body: 'harga kopi Pangalengan' } };
    expect(parseInboundWebhook(payload)).toBeNull();
  });

  it('ignores payloads missing body or from', () => {
    expect(parseInboundWebhook({ event: 'message', payload: { fromMe: false } })).toBeNull();
  });

  it('ignores malformed input', () => {
    expect(parseInboundWebhook(null)).toBeNull();
    expect(parseInboundWebhook('not an object')).toBeNull();
    expect(parseInboundWebhook({})).toBeNull();
  });

  it('ignores group chats so a group member typing "harga ..." does not get a garbled reply target', () => {
    const payload = {
      event: 'message',
      payload: { from: '120363012345678901@g.us', fromMe: false, body: 'harga kopi Pangalengan' },
    };
    expect(parseInboundWebhook(payload)).toBeNull();
  });

  it('ignores broadcast and newsletter/channel senders', () => {
    const broadcast = { event: 'message', payload: { from: 'status@broadcast', fromMe: false, body: 'harga kopi Pangalengan' } };
    const newsletter = { event: 'message', payload: { from: '123456789@newsletter', fromMe: false, body: 'harga kopi Pangalengan' } };
    expect(parseInboundWebhook(broadcast)).toBeNull();
    expect(parseInboundWebhook(newsletter)).toBeNull();
  });

  it('still accepts @lid senders (this WAHA account represents even self-chat via @lid, not just @c.us)', () => {
    const payload = {
      event: 'message',
      payload: { from: '177743094411494@lid', fromMe: false, body: 'harga kopi Pangalengan' },
    };
    expect(parseInboundWebhook(payload)).toEqual({ telepon: '177743094411494', body: 'harga kopi Pangalengan' });
  });
});

describe('shouldRespond', () => {
  it('responds to messages starting with "harga" (case-insensitive)', () => {
    expect(shouldRespond('harga kopi Pangalengan')).toBe(true);
    expect(shouldRespond('HARGA sawit Bandung')).toBe(true);
    expect(shouldRespond('  harga kopi Pangalengan  ')).toBe(true);
  });

  it('stays silent for unrelated chatter to avoid spamming the inbox', () => {
    expect(shouldRespond('halo')).toBe(false);
    expect(shouldRespond('terima kasih')).toBe(false);
  });
});
