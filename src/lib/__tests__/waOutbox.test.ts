import { clearAllData, getWaOutbox } from '../db';
import { enqueueWa, flushWaOutbox } from '../waOutbox';
import { sendText } from '../waha';

jest.mock('../waha', () => ({
  ...jest.requireActual('../waha'),
  sendText: jest.fn(),
  isWaConfigured: jest.fn(() => true),
  officerChatId: jest.fn(() => '6281234567890@c.us'),
}));

const sendTextMock = sendText as jest.MockedFunction<typeof sendText>;

beforeEach(async () => {
  await clearAllData();
  sendTextMock.mockReset().mockResolvedValue(undefined);
});

test('enqueueWa stores a pending message addressed to the officer', async () => {
  await enqueueWa('Akses tak berizin');

  const outbox = await getWaOutbox();
  expect(outbox).toHaveLength(1);
  expect(outbox[0]).toMatchObject({
    chatId: '6281234567890@c.us',
    text: 'Akses tak berizin',
    status: 'pending',
    attempts: 0,
  });
});

test('enqueueWa does not send immediately — offline stays offline', async () => {
  await enqueueWa('Halo');
  expect(sendTextMock).not.toHaveBeenCalled();
});

test('flushWaOutbox sends pending messages and marks them sent', async () => {
  await enqueueWa('Pesan satu');
  await enqueueWa('Pesan dua');

  const result = await flushWaOutbox();

  expect(sendTextMock).toHaveBeenCalledTimes(2);
  expect(result).toEqual({ sent: 2, failed: 0 });
  const outbox = await getWaOutbox();
  expect(outbox.every(i => i.status === 'sent')).toBe(true);
  expect(outbox[0].sentAt).toBeDefined();
});

test('flushWaOutbox marks failed and records the error when the send throws', async () => {
  sendTextMock.mockRejectedValue(new Error('WAHA 500: boom'));
  await enqueueWa('Pesan gagal');

  const result = await flushWaOutbox();

  expect(result).toEqual({ sent: 0, failed: 1 });
  const [item] = await getWaOutbox();
  expect(item.status).toBe('failed');
  expect(item.attempts).toBe(1);
  expect(item.lastError).toMatch(/boom/);
});

test('flushWaOutbox retries a previously failed message', async () => {
  sendTextMock.mockRejectedValueOnce(new Error('offline'));
  await enqueueWa('Coba lagi');
  await flushWaOutbox();

  const result = await flushWaOutbox();

  expect(result).toEqual({ sent: 1, failed: 0 });
  const [item] = await getWaOutbox();
  expect(item.status).toBe('sent');
  expect(item.attempts).toBe(2);
});

test('a second flush while one is in flight does not double-send', async () => {
  // Build the gate up front: assigning `release` from inside the mock would
  // race, since the mock only runs once the first flush reaches sendText.
  let release: () => void = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  sendTextMock.mockImplementation(() => gate);
  await enqueueWa('Sekali saja');

  const first = flushWaOutbox();
  const second = await flushWaOutbox();
  release();
  await first;

  expect(sendTextMock).toHaveBeenCalledTimes(1);
  expect(second).toEqual({ sent: 0, failed: 0 });
});

test('flushWaOutbox leaves already-sent messages alone', async () => {
  await enqueueWa('Sekali saja');
  await flushWaOutbox();
  sendTextMock.mockClear();

  const result = await flushWaOutbox();

  expect(sendTextMock).not.toHaveBeenCalled();
  expect(result).toEqual({ sent: 0, failed: 0 });
});
