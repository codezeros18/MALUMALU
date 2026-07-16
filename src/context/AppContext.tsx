import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { pushPendingSync, supabaseBackend } from '../lib/sync';
import { listSyncQueue } from '../lib/db';
import { getItem, setItem, removeItem } from '../lib/storage';

const SYNC_INTERVAL_MS = 30000;
const CURRENT_ROLE_KEY = 'current-role';

export type Role = 'petani' | 'agen' | 'eksportir';

function isRole(value: unknown): value is Role {
  return value === 'petani' || value === 'agen' || value === 'eksportir';
}

interface AppContextValue {
  notifVersion: number;
  refreshNotif: () => void;
  syncVersion: number;
  bumpSyncVersion: () => void;
  triggerSync: () => Promise<void>;
  currentRole: Role | null;
  setRole: (role: Role | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<Role | null>(() => {
    const stored = getItem<string>(CURRENT_ROLE_KEY);
    return isRole(stored) ? stored : null;
  });
  const setRole = useCallback((role: Role | null) => {
    setCurrentRole(role);
    if (role) {
      setItem(CURRENT_ROLE_KEY, role);
    } else {
      removeItem(CURRENT_ROLE_KEY);
    }
  }, []);

  const [notifVersion, setNotifVersion] = useState(0);
  const refreshNotif = useCallback(() => setNotifVersion((v) => v + 1), []);

  const [syncVersion, setSyncVersion] = useState(0);
  const bumpSyncVersion = useCallback(() => setSyncVersion((v) => v + 1), []);

  const isOnline = useOnlineStatus();
  const wasOnlineRef = useRef(isOnline);

  const triggerSync = useCallback(async () => {
    try {
      await pushPendingSync(supabaseBackend);
    } catch (err) {
      console.error('[AppContext] sinkron gagal', err);
    } finally {
      bumpSyncVersion();
    }
  }, [bumpSyncVersion]);

  // Sinkron otomatis begitu transisi offline -> online.
  useEffect(() => {
    const wasOffline = !wasOnlineRef.current;
    wasOnlineRef.current = isOnline;
    if (isOnline && wasOffline) {
      triggerSync();
    }
  }, [isOnline, triggerSync]);

  // Retry ringan berkala selama online — HANYA jalan kalau syncQueue benar-benar
  // tidak kosong (bukan polling tanpa syarat setiap interval).
  useEffect(() => {
    if (!isOnline) return;
    const interval = setInterval(async () => {
      try {
        const queue = await listSyncQueue();
        if (queue.length > 0) {
          await triggerSync();
        }
      } catch (err) {
        console.error('[AppContext] cek syncQueue gagal', err);
      }
    }, SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isOnline, triggerSync]);

  const value = useMemo(
    () => ({
      notifVersion,
      refreshNotif,
      syncVersion,
      bumpSyncVersion,
      triggerSync,
      currentRole,
      setRole,
    }),
    [notifVersion, refreshNotif, syncVersion, bumpSyncVersion, triggerSync, currentRole, setRole],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext harus dipakai di dalam <AppProvider>.');
  return ctx;
}
