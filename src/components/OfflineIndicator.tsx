import { useOnlineStatus } from '../hooks/useOnlineStatus';

export default function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" aria-hidden />
        Online
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium bg-red-50 text-red-700 px-2.5 py-1 rounded-full"
      title="App tetap berfungsi penuh tanpa internet: peta koordinat, cek deforestasi, kartu, hash-chain, consent & notif semua jalan offline."
    >
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" aria-hidden />
      Offline (mode lapangan)
    </span>
  );
}
