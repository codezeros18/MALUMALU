import { EventEmitter } from 'events';
import {
  parseInboundWebhook,
  shouldRespond,
  readBody,
  PayloadTooLargeError,
  MAX_WEBHOOK_BODY_BYTES,
} from '../webhookParser';

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

  it('does not skip when fromMe is a non-boolean truthy value (strict === true check)', () => {
    const payload = {
      event: 'message',
      payload: { from: '6281234567890@c.us', fromMe: 'yes', body: 'harga kopi Pangalengan' },
    };
    expect(parseInboundWebhook(payload)).toEqual({ telepon: '6281234567890', body: 'harga kopi Pangalengan' });
  });

  it('ignores group chat messages (@g.us) instead of mangling them into a fake phone number', () => {
    const payload = {
      event: 'message',
      payload: { from: '120363012345678901@g.us', fromMe: false, body: 'harga kopi Pangalengan' },
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
});

describe('readBody', () => {
  function fakeRequest() {
    const emitter = new EventEmitter() as EventEmitter & { destroy?: () => void };
    emitter.destroy = jest.fn();
    return emitter;
  }

  it('resolves with the concatenated body once the stream ends', async () => {
    const req = fakeRequest();
    const promise = readBody(req);
    req.emit('data', Buffer.from('{"event":"message"'));
    req.emit('data', Buffer.from(',"payload":{}}'));
    req.emit('end');
    await expect(promise).resolves.toBe('{"event":"message","payload":{}}');
  });

  it('rejects with PayloadTooLargeError and destroys the stream once maxBytes is exceeded', async () => {
    const req = fakeRequest();
    const promise = readBody(req, 10);
    req.emit('data', Buffer.from('this chunk is way over ten bytes'));
    await expect(promise).rejects.toBeInstanceOf(PayloadTooLargeError);
    expect(req.destroy).toHaveBeenCalled();
  });

  it('does not resolve after rejecting even if end fires later', async () => {
    const req = fakeRequest();
    const promise = readBody(req, 5);
    req.emit('data', Buffer.from('too many bytes here'));
    await expect(promise).rejects.toBeInstanceOf(PayloadTooLargeError);
    req.emit('end'); // should be a no-op, promise already settled
  });

  it('rejects on stream error', async () => {
    const req = fakeRequest();
    const promise = readBody(req);
    req.emit('error', new Error('boom'));
    await expect(promise).rejects.toThrow('boom');
  });

  it('default max size is 100KB', () => {
    expect(MAX_WEBHOOK_BODY_BYTES).toBe(100 * 1024);
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
