import { useCallback, useEffect, useState } from 'react';
import { listNotif, markNotifRead } from '../lib/db';
import { useAppContext } from '../context/AppContext';
import type { NotifItem } from '../types';

const SEVERITY_STYLE: Record<NotifItem['severity'], string> = {
  info: 'bg-slate-800 text-white',
  warning: 'bg-amber-500 text-white',
  alert: 'bg-red-600 text-white',
};

export default function NotifBanner() {
  const { notifVersion } = useAppContext();
  const [notifs, setNotifs] = useState<NotifItem[]>([]);

  const refresh = useCallback(async () => {
    try {
      const all = await listNotif();
      setNotifs(all.filter((n) => !n.read));
    } catch (err) {
      console.error('[NotifBanner] gagal memuat notif', err);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, notifVersion]);

  const handleDismiss = async (id: string) => {
    try {
      await markNotifRead(id);
      await refresh();
    } catch (err) {
      console.error('[NotifBanner] gagal menandai notif terbaca', err);
    }
  };

  if (notifs.length === 0) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[2000] flex flex-col gap-2 p-2 pointer-events-none">
      {notifs.map((n) => (
        <div
          key={n.id}
          className={`pointer-events-auto max-w-lg mx-auto w-full rounded-md shadow-lg px-4 py-3 flex items-start justify-between gap-3 ${SEVERITY_STYLE[n.severity]}`}
        >
          <span className="text-sm">{n.message}</span>
          <button
            type="button"
            onClick={() => handleDismiss(n.id)}
            className="text-xs underline opacity-80 hover:opacity-100 shrink-0"
          >
            Tandai terbaca
          </button>
        </div>
      ))}
    </div>
  );
}
