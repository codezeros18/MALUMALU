import { useAppContext } from '../context/AppContext';
import { Wifi, WifiOff } from 'lucide-react';

export default function OfflineIndicator() {
  const { isOnline, toggleOnlineStatus } = useAppContext();

  return (
    <button
      onClick={toggleOnlineStatus}
      type="button"
      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all duration-300 active:scale-95 cursor-pointer shadow-xs ${
        isOnline
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 hover:bg-emerald-100/50'
          : 'bg-rose-50 text-rose-700 border-rose-200/60 hover:bg-rose-100/50'
      }`}
      title="Klik untuk simulasi mode luring (offline) di lapangan Pangalengan!"
    >
      {isOnline ? (
        <>
          <Wifi size={13} className="text-emerald-500" />
          <span>Online (Bersambung)</span>
        </>
      ) : (
        <>
          <WifiOff size={13} className="text-rose-500 animate-pulse" />
          <span>Luring (Offline-First)</span>
        </>
      )}
    </button>
  );
}
