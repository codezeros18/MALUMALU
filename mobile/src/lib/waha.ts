const TIMEOUT_MS = 10000;
const DEFAULT_SESSION = 'default';
const ID_COUNTRY_CODE = '62';

// Expo only inlines env vars referenced as static `process.env.EXPO_PUBLIC_*` dot
// notation, so these reads cannot be destructured or built dynamically.
function config() {
  return {
    baseUrl: process.env.EXPO_PUBLIC_WAHA_URL,
    apiKey: process.env.EXPO_PUBLIC_WAHA_API_KEY,
    session: process.env.EXPO_PUBLIC_WAHA_SESSION || DEFAULT_SESSION,
    officer: process.env.EXPO_PUBLIC_WA_OFFICER,
  };
}

export function toChatId(telepon: string): string {
  const digits = telepon.replace(/\D/g, '');
  const international = digits.startsWith('0')
    ? `${ID_COUNTRY_CODE}${digits.slice(1)}`
    : digits;
  return `${international}@c.us`;
}

export function isWaConfigured(): boolean {
  const { baseUrl, apiKey, officer } = config();
  return Boolean(baseUrl && apiKey && officer);
}

export function officerChatId(): string | null {
  const { officer } = config();
  return officer ? toChatId(officer) : null;
}

export async function sendText(chatId: string, text: string): Promise<void> {
  const { baseUrl, apiKey, session } = config();
  if (!baseUrl || !apiKey) throw new Error('WAHA belum dikonfigurasi (.env)');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${baseUrl}/api/sendText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
      body: JSON.stringify({ session, chatId, text }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`WAHA ${res.status}: ${await res.text()}`);
  } finally {
    clearTimeout(timer);
  }
}
