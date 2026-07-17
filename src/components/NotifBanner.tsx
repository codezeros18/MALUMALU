import { useAppContext } from '../context/AppContext';
import { Bell, X, ShieldAlert, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export default function NotifBanner() {
  const { notifications, clearNotifications } = useAppContext();
  const unreadNotifs = notifications.filter(n => !n.read);

  if (unreadNotifs.length === 0) return null;

  // Show only the latest unread notification to keep the UI clean
  const latestNotif = unreadNotifs[0];

  const iconStyles = {
    info: <Info className="text-blue-500 shrink-0" size={18} />,
    success: <CheckCircle className="text-emerald-500 shrink-0" size={18} />,
    warning: <AlertTriangle className="text-amber-500 shrink-0" size={18} />,
    alert: <ShieldAlert className="text-rose-500 shrink-0" size={18} />,
  };

  const bgStyles = {
    info: 'bg-blue-50/95 border-blue-200/50 text-blue-900',
    success: 'bg-emerald-50/95 border-emerald-200/50 text-emerald-900',
    warning: 'bg-amber-50/95 border-amber-200/50 text-amber-900',
    alert: 'bg-rose-50/95 border-rose-200/50 text-rose-900',
  };

  return (
    <div className="fixed top-18 right-4 left-4 md:left-auto md:w-[380px] z-[2000] pointer-events-none animate-fade-in">
      <div className={`pointer-events-auto border rounded-xl shadow-xl p-4 flex gap-3 backdrop-blur-md transition-all duration-300 ${bgStyles[latestNotif.type]}`}>
        {iconStyles[latestNotif.type]}
        <div className="flex-1 space-y-1">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">
              Notifikasi Sistem
            </span>
            <span className="text-[10px] font-mono opacity-60">
              {latestNotif.timestamp}
            </span>
          </div>
          <p className="text-xs font-medium leading-normal">
            {latestNotif.message}
          </p>
          <div className="pt-1.5 flex justify-end">
            <button
              onClick={clearNotifications}
              className="text-[10px] font-bold uppercase tracking-wider hover:opacity-80 transition-opacity"
            >
              Hapus Semua Notif
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
