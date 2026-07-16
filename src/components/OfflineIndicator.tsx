import { useOnlineStatus } from '../hooks/useOnlineStatus';

export default function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-brand-400/20 text-brand-100 px-2 py-1 rounded-full">
        🟢 Online
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 text-xs bg-red-500/20 text-red-100 px-2 py-1 rounded-full"
      title="App tetap berfungsi penuh tanpa internet: peta koordinat, cek deforestasi, kartu, hash-chain, consent & notif semua jalan offline."
    >
      🔴 Offline (mode lapangan)
    </span>
  );
}
