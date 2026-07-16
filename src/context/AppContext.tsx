import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface AppContextValue {
  notifVersion: number;
  refreshNotif: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [notifVersion, setNotifVersion] = useState(0);
  const refreshNotif = useCallback(() => setNotifVersion((v) => v + 1), []);
  const value = useMemo(() => ({ notifVersion, refreshNotif }), [notifVersion, refreshNotif]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext harus dipakai di dalam <AppProvider>.');
  return ctx;
}
