import { isWaConfigured, officerChatId, sendText, toChatId } from '../waha';

// Clean up key-by-key: reassigning `process.env` wholesale swaps the object out
// from under the module under test, which keeps a reference to the original.
const WA_KEYS = [
  'EXPO_PUBLIC_WAHA_URL',
  'EXPO_PUBLIC_WAHA_API_KEY',
  'EXPO_PUBLIC_WAHA_SESSION',
  'EXPO_PUBLIC_WA_OFFICER',
] as const;

beforeEach(() => {
  process.env.EXPO_PUBLIC_WAHA_URL = 'http://10.0.0.5:3000';
  process.env.EXPO_PUBLIC_WAHA_API_KEY = 'testkey';
  process.env.EXPO_PUBLIC_WAHA_SESSION = 'default';
  process.env.EXPO_PUBLIC_WA_OFFICER = '081234567890';
});

afterEach(() => {
  WA_KEYS.forEach(k => delete process.env[k]);
  jest.restoreAllMocks();
});

test('toChatId converts leading 0 to Indonesian country code', () => {
  expect(toChatId('081234567890')).toBe('6281234567890@c.us');
});

test('toChatId strips plus, spaces and dashes', () => {
  expect(toChatId('+62 812-3456-7890')).toBe('6281234567890@c.us');
});

test('toChatId leaves an already 62-prefixed number alone', () => {
  expect(toChatId('6281234567890')).toBe('6281234567890@c.us');
});

test('isWaConfigured is false when the officer number is missing', () => {
  delete process.env.EXPO_PUBLIC_WA_OFFICER;
  expect(isWaConfigured()).toBe(false);
});

test('isWaConfigured is true when url, key and officer are all set', () => {
  expect(isWaConfigured()).toBe(true);
  expect(officerChatId()).toBe('6281234567890@c.us');
});

test('sendText posts session, chatId and text to WAHA with the api key header', async () => {
  const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 201, text: async () => '{}' });
  globalThis.fetch = fetchMock as unknown as typeof fetch;

  await sendText('6281234567890@c.us', 'Halo');

  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe('http://10.0.0.5:3000/api/sendText');
  expect(init.method).toBe('POST');
  expect(init.headers['X-Api-Key']).toBe('testkey');
  expect(JSON.parse(init.body)).toEqual({
    session: 'default',
    chatId: '6281234567890@c.us',
    text: 'Halo',
  });
});

test('sendText throws with status and body when WAHA rejects the request', async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status: 422,
    text: async () => 'session not working',
  }) as unknown as typeof fetch;

  await expect(sendText('628@c.us', 'x')).rejects.toThrow(/422.*session not working/);
});
