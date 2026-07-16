// Wrapper tipis untuk localStorage — hanya untuk flags kecil (mis. "onboarding-done",
// "active-petani-id"). JANGAN dipakai untuk data besar (pakai lib/db.ts / IndexedDB).

export function getItem<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`[storage] getItem(${key}) failed`, err);
    return null;
  }
}

export function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`[storage] setItem(${key}) failed`, err);
  }
}

export function removeItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.error(`[storage] removeItem(${key}) failed`, err);
  }
}
