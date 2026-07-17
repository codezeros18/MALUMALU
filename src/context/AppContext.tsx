import React, { createContext, useContext, useState, useEffect } from 'react';
import { Role, Petani, Plot, ConsentRequest, AccessLog, AppNotification } from '../types';

interface AppContextType {
  currentRole: Role | null;
  activePetaniId: string | null;
  petaniList: Petani[];
  plots: Plot[];
  consentRequests: ConsentRequest[];
  accessLogs: AccessLog[];
  notifications: AppNotification[];
  isOnline: boolean;
  setRole: (role: Role | null) => void;
  setActivePetaniId: (id: string | null) => void;
  addPetani: (petani: Omit<Petani, 'id' | 'registrationDate' | 'isSynced'>) => string;
  addPlot: (plot: Omit<Plot, 'id' | 'signatureHash' | 'verifiedAt' | 'logs'>) => string;
  updatePlot: (id: string, updates: Partial<Plot>) => void;
  verifyPlotHash: (id: string) => boolean;
  tamperPlotData: (id: string) => void; // Simulation tool for showing tamper-detection!
  simulateAccessPlot: (plotId: string, readerName: string, readerRole: string, purpose: string) => { authorized: boolean; error?: string };
  updateConsentRequest: (id: string, status: 'disetujui' | 'ditolak', negotiatedPrice?: number) => void;
  triggerConsentRequest: (plotId: string, exporterName: string, bidPrice?: number) => void;
  toggleOnlineStatus: () => void;
  addNotification: (message: string, type?: AppNotification['type']) => void;
  clearNotifications: () => void;
  resetToDefault: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper function for deterministic sync hash computation
export function calculatePlotHash(plot: {
  petaniId: string;
  name: string;
  latitude: number;
  longitude: number;
  areaSize: number;
  commodity: string;
  forestRisk: string;
  stdbStatus: string;
  tier: string;
  isCorrected: boolean;
}): string {
  const payload = [
    plot.petaniId,
    plot.name,
    plot.latitude.toFixed(6),
    plot.longitude.toFixed(6),
    plot.areaSize.toFixed(2),
    plot.commodity,
    plot.forestRisk,
    plot.stdbStatus,
    plot.tier,
    plot.isCorrected ? 'Y' : 'N'
  ].join('|');

  // Deterministic FNV-1a-like hash to make a robust 64-character pseudo-SHA-256
  let h1 = 0x811c9dc5;
  let h2 = 0xcbf29ce4;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    h1 ^= char;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= char;
    h2 = Math.imul(h2, 0x01000193);
  }

  const hex1 = Math.abs(h1).toString(16).padStart(8, '0');
  const hex2 = Math.abs(h2).toString(16).padStart(8, '0');
  
  // Combine with a salt and repeat to get a full 64-char elegant hash
  const salt = "pasporpetanipangalenganbandung2026kriptoverifikasi";
  let hex3 = 0;
  for (let i = 0; i < salt.length; i++) {
    hex3 = (hex3 << 5) - hex3 + salt.charCodeAt(i) + h1;
    hex3 |= 0;
  }
  const hex3Str = Math.abs(hex3).toString(16).padStart(8, '0');
  
  return (hex1 + hex2 + hex3Str + hex1 + hex2 + hex3Str + hex1 + hex2).substring(0, 64);
}

// Initial realistic demo data representing Pangalengan, Bandung coffee farmers
const DEFAULT_PETANI: Petani[] = [
  {
    id: 'petani-jaja',
    name: 'Pak Jaja Suparman',
    nik: '3204221105740003',
    phone: '0812-3456-7890',
    group: 'Koperasi Kopi Klasik Sunda',
    registrationDate: '2026-03-12',
    isSynced: true,
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    desa: 'Cibeureum',
    email: 'jaja@sunda.coop'
  },
  {
    id: 'petani-siti',
    name: 'Ibu Siti Aminah',
    nik: '3204224508820001',
    phone: '0857-9876-5432',
    group: 'Koperasi Kopi Klasik Sunda',
    registrationDate: '2026-04-05',
    isSynced: true,
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
    desa: 'Malabar',
    email: 'siti@sunda.coop'
  },
  {
    id: 'petani-cecep',
    name: 'Pak Cecep Hidayat',
    nik: '3204221802800004',
    phone: '0819-1122-3344',
    group: 'Kelompok Tani Gunung Tilu',
    registrationDate: '2026-05-18',
    isSynced: false,
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
    desa: 'Warnasari',
    email: 'cecep@guntil.org'
  },
];

const DEFAULT_PLOTS = (petaniList: Petani[]): Plot[] => {
  const plotsData = [
    {
      id: 'plot-jaja-1',
      petaniId: 'petani-jaja',
      name: 'Kebun Kopi Cibeureum (Sunda)',
      latitude: -7.178520,
      longitude: 107.612450,
      areaSize: 1.25,
      commodity: 'Kopi Arabika (Typica)',
      forestRisk: 'Aman' as const,
      stdbStatus: 'Terbit' as const,
      tier: 'Export-Ready' as const,
      reasons: [
        'Sesuai peta JRC Forest Cover 2020 (Bebas Deforestasi)',
        'Titik koordinat berhasil diverifikasi dengan GPS ± 4.2m',
        'Surat Tanda Daftar Budidaya (STDB) terbit No: 503/STDB/2026',
        'Klaim kepemilikan lahan didukung AJB No. 12/2018'
      ],
      isCorrected: false,
      verifiedAt: '2026-05-20 14:32',
      accuracyM: 4.2,
      email: 'jaja@sunda.coop'
    },
    {
      id: 'plot-siti-1',
      petaniId: 'petani-siti',
      name: 'Kebun Kopi Lereng Malabar',
      latitude: -7.195630,
      longitude: 107.625840,
      areaSize: 0.85,
      commodity: 'Kopi Arabika (Sigararutang)',
      forestRisk: 'Risiko Rendah' as const,
      stdbStatus: 'Dalam Proses' as const,
      tier: 'Lokal / Program' as const,
      reasons: [
        'Dekat dengan batas kawasan hutan (~25 meter)',
        'Koordinat GPS tervalidasi pada tutupan lahan sekunder',
        'STDB dalam pengajuan verifikasi Dinas Pertanian Kabupaten',
        'Peta JRC mendeteksi vegetasi rapat namun berumur >10 tahun'
      ],
      isCorrected: false,
      verifiedAt: '2026-06-02 10:15',
      accuracyM: 6.8,
      email: 'siti@sunda.coop'
    },
    {
      id: 'plot-cecep-1',
      petaniId: 'petani-cecep',
      name: 'Kebun Kopi Warnasari Atas',
      latitude: -7.210450,
      longitude: 107.604120,
      areaSize: 1.50,
      commodity: 'Kopi Arabika (Kartika)',
      forestRisk: 'Risiko Tinggi' as const,
      stdbStatus: 'Belum Ada' as const,
      tier: 'Lokal / Program' as const,
      reasons: [
        'Titik berada di dalam grid JRC Forest Cover 2020',
        'Terjadi indikasi tebang-pilih (logging) pasca 2020',
        'Belum mengajukan dokumen STDB (hanya klaim lisan waris)',
        'Membutuhkan verifikasi fisik tingkat lanjut'
      ],
      isCorrected: false,
      verifiedAt: '2026-06-15 16:45',
      accuracyM: 11.4,
      email: 'cecep@guntil.org'
    },
  ];

  return plotsData.map(p => {
    const signatureHash = calculatePlotHash({
      petaniId: p.petaniId,
      name: p.name,
      latitude: p.latitude,
      longitude: p.longitude,
      areaSize: p.areaSize,
      commodity: p.commodity,
      forestRisk: p.forestRisk,
      stdbStatus: p.stdbStatus,
      tier: p.tier,
      isCorrected: p.isCorrected
    });

    return {
      ...p,
      signatureHash,
      logs: [
        {
          timestamp: p.verifiedAt,
          action: 'Penerbitan Paspor Petani Pertama',
          operator: 'Andi Wijaya (Agen Penyuluh)',
          hash: signatureHash,
          valid: true
        }
      ]
    };
  });
};

const DEFAULT_CONSENTS: ConsentRequest[] = [
  {
    id: 'req-1',
    plotId: 'plot-jaja-1',
    exporterName: 'PT Java Coffee Quality (Exporter)',
    status: 'disetujui',
    requestedAt: '2026-06-10 09:00',
    respondedAt: '2026-06-11 11:30',
    bidPrice: 62000,
    bidStatus: 'diterima'
  },
  {
    id: 'req-2',
    plotId: 'plot-siti-1',
    exporterName: 'PT Sunda Agro Persada (Exporter)',
    status: 'diminta',
    requestedAt: '2026-07-15 15:20',
    bidPrice: 55000,
    bidStatus: 'pending'
  }
];

const DEFAULT_ACCESS_LOGS: AccessLog[] = [
  {
    id: 'log-1',
    plotId: 'plot-jaja-1',
    petaniId: 'petani-jaja',
    readerRole: 'eksportir',
    readerName: 'PT Java Coffee Quality',
    purpose: 'Verifikasi kepatuhan EUDR untuk Kontainer ID #J-992',
    timestamp: '2026-06-12 10:24',
    authorized: true
  },
  {
    id: 'log-2',
    plotId: 'plot-jaja-1',
    petaniId: 'petani-jaja',
    readerRole: 'eksportir',
    readerName: 'PT Bandung Trading Corp (Tanpa Izin)',
    purpose: 'Pengecekan supply pool sekunder',
    timestamp: '2026-07-14 08:45',
    authorized: false // This will trigger the alert notification!
  }
];

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    message: 'Percobaan akses tanpa izin terdeteksi! PT Bandung Trading Corp mencoba membaca Koordinat Kebun Cibeureum tanpa consent.',
    timestamp: '2026-07-14 08:45',
    type: 'alert',
    read: false
  },
  {
    id: 'notif-2',
    message: 'Data kebun kopi baru ditambahkan oleh Agen di Warnasari (Pak Cecep), siap sinkronisasi.',
    timestamp: '2026-07-15 11:00',
    type: 'info',
    read: true
  }
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentRole, setRoleState] = useState<Role | null>(() => {
    const saved = localStorage.getItem('paspor_petani_role');
    return saved ? (saved as Role) : null;
  });

  const [activePetaniId, setActivePetaniIdState] = useState<string | null>(() => {
    return localStorage.getItem('paspor_petani_active_id') || 'petani-jaja';
  });

  const [petaniList, setPetaniList] = useState<Petani[]>(() => {
    const saved = localStorage.getItem('paspor_petani_list');
    return saved ? JSON.parse(saved) : DEFAULT_PETANI;
  });

  const [plots, setPlots] = useState<Plot[]>(() => {
    const saved = localStorage.getItem('paspor_petani_plots');
    return saved ? JSON.parse(saved) : DEFAULT_PLOTS(DEFAULT_PETANI);
  });

  const [consentRequests, setConsentRequests] = useState<ConsentRequest[]>(() => {
    const saved = localStorage.getItem('paspor_petani_consents');
    return saved ? JSON.parse(saved) : DEFAULT_CONSENTS;
  });

  const [accessLogs, setAccessLogs] = useState<AccessLog[]>(() => {
    const saved = localStorage.getItem('paspor_petani_access_logs');
    return saved ? JSON.parse(saved) : DEFAULT_ACCESS_LOGS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('paspor_petani_notifications');
    return saved ? JSON.parse(saved) : DEFAULT_NOTIFICATIONS;
  });

  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Persistence triggers
  useEffect(() => {
    localStorage.setItem('paspor_petani_list', JSON.stringify(petaniList));
  }, [petaniList]);

  useEffect(() => {
    localStorage.setItem('paspor_petani_plots', JSON.stringify(plots));
  }, [plots]);

  useEffect(() => {
    localStorage.setItem('paspor_petani_consents', JSON.stringify(consentRequests));
  }, [consentRequests]);

  useEffect(() => {
    localStorage.setItem('paspor_petani_access_logs', JSON.stringify(accessLogs));
  }, [accessLogs]);

  useEffect(() => {
    localStorage.setItem('paspor_petani_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const setRole = (role: Role | null) => {
    setRoleState(role);
    if (role) {
      localStorage.setItem('paspor_petani_role', role);
      // Auto assign active farmer ID if logging in as farmer
      if (role === 'petani' && !activePetaniId) {
        setActivePetaniIdState('petani-jaja');
        localStorage.setItem('paspor_petani_active_id', 'petani-jaja');
      }
    } else {
      localStorage.removeItem('paspor_petani_role');
    }
  };

  const setActivePetaniId = (id: string | null) => {
    setActivePetaniIdState(id);
    if (id) {
      localStorage.setItem('paspor_petani_active_id', id);
    } else {
      localStorage.removeItem('paspor_petani_active_id');
    }
  };

  const addNotification = (message: string, type: AppNotification['type'] = 'info') => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      message,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      type,
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const toggleOnlineStatus = () => {
    setIsOnline(prev => {
      const next = !prev;
      addNotification(
        next ? 'Kembali online. Sinkronisasi data ke cloud aktif.' : 'Masuk ke mode luring (offline). Operasi geospasial point-in-raster & kriptografi tetap berjalan penuh.',
        next ? 'success' : 'warning'
      );
      
      // If we go online, automatically sync local unsynced farmers
      if (next) {
        setPetaniList(prevList => {
          const unsyncedCount = prevList.filter(p => !p.isSynced).length;
          if (unsyncedCount > 0) {
            setTimeout(() => {
              addNotification(`Sinkronisasi berhasil! ${unsyncedCount} data petani luring berhasil diunggah ke cloud.`, 'success');
            }, 1500);
          }
          return prevList.map(p => ({ ...p, isSynced: true }));
        });
      }
      return next;
    });
  };

  const addPetani = (p: Omit<Petani, 'id' | 'registrationDate' | 'isSynced'>): string => {
    const id = `petani-${Date.now()}`;
    const newPetani: Petani = {
      ...p,
      id,
      registrationDate: new Date().toISOString().split('T')[0],
      isSynced: isOnline,
    };
    setPetaniList(prev => [...prev, newPetani]);
    addNotification(`Petani ${newPetani.name} berhasil terdaftar ${isOnline ? 'dan tersinkronisasi' : '(tersimpan secara luring)'}.`, 'success');
    return id;
  };

  const addPlot = (p: Omit<Plot, 'id' | 'signatureHash' | 'verifiedAt' | 'logs'>): string => {
    const id = `plot-${Date.now()}`;
    const verifiedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    
    const signatureHash = calculatePlotHash({
      petaniId: p.petaniId,
      name: p.name,
      latitude: p.latitude,
      longitude: p.longitude,
      areaSize: p.areaSize,
      commodity: p.commodity,
      forestRisk: p.forestRisk,
      stdbStatus: p.stdbStatus,
      tier: p.tier,
      isCorrected: p.isCorrected
    });

    const newPlot: Plot = {
      ...p,
      id,
      verifiedAt,
      signatureHash,
      logs: [
        {
          timestamp: verifiedAt,
          action: 'Penerbitan Paspor Petani Pertama (Point-Primary & JRC Check)',
          operator: 'Budi Santoso (Agen Lapangan)',
          hash: signatureHash,
          valid: true
        }
      ]
    };

    setPlots(prev => [newPlot, ...prev]);
    addNotification(`Paspor Petani untuk plot "${newPlot.name}" berhasil diterbitkan secara aman. Hash: ${signatureHash.substring(0, 10)}...`, 'success');
    return id;
  };

  const updatePlot = (id: string, updates: Partial<Plot>) => {
    setPlots(prev => prev.map(plot => {
      if (plot.id !== id) return plot;

      const merged = { ...plot, ...updates };
      const newHash = calculatePlotHash({
        petaniId: merged.petaniId,
        name: merged.name,
        latitude: merged.latitude,
        longitude: merged.longitude,
        areaSize: merged.areaSize,
        commodity: merged.commodity,
        forestRisk: merged.forestRisk,
        stdbStatus: merged.stdbStatus,
        tier: merged.tier,
        isCorrected: merged.isCorrected
      });

      const updatedLogs = [
        ...merged.logs,
        {
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          action: updates.isCorrected ? 'Koreksi Petugas Manual & Pembaruan Hash' : 'Pembaruan Data Plot',
          operator: 'Petugas Administrator',
          hash: newHash,
          valid: true
        }
      ];

      return {
        ...merged,
        signatureHash: newHash,
        logs: updatedLogs
      };
    }));
    addNotification('Plot kebun berhasil dimodifikasi dan ditandatangani ulang secara kriptografis.', 'success');
  };

  const tamperPlotData = (id: string) => {
    setPlots(prev => prev.map(plot => {
      if (plot.id !== id) return plot;
      return {
        ...plot,
        name: `${plot.name} (MODIFIKASI_ILEGAL)`,
        latitude: plot.latitude - 0.05,
        areaSize: plot.areaSize * 2,
      };
    }));
    addNotification('SIMULASI: Data plot berhasil dimanipulasi di basis data lokal secara tidak sah tanpa menandatanganinya ulang. Coba cek validitas kriptografinya sekarang!', 'warning');
  };

  const verifyPlotHash = (id: string): boolean => {
    const plot = plots.find(p => p.id === id);
    if (!plot) return false;
    const computed = calculatePlotHash({
      petaniId: plot.petaniId,
      name: plot.name,
      latitude: plot.latitude,
      longitude: plot.longitude,
      areaSize: plot.areaSize,
      commodity: plot.commodity,
      forestRisk: plot.forestRisk,
      stdbStatus: plot.stdbStatus,
      tier: plot.tier,
      isCorrected: plot.isCorrected
    });
    return computed === plot.signatureHash;
  };

  const simulateAccessPlot = (plotId: string, readerName: string, readerRole: string, purpose: string) => {
    const plot = plots.find(p => p.id === plotId);
    if (!plot) return { authorized: false, error: 'Plot tidak ditemukan' };

    const farmer = petaniList.find(pt => pt.id === plot.petaniId);
    if (!farmer) return { authorized: false, error: 'Petani tidak ditemukan' };

    const consent = consentRequests.find(r => r.plotId === plotId && r.exporterName === readerName);
    const authorized = consent ? consent.status === 'disetujui' : false;

    const newLog: AccessLog = {
      id: `log-${Date.now()}`,
      plotId,
      petaniId: plot.petaniId,
      readerRole,
      readerName,
      purpose,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      authorized
    };

    setAccessLogs(prev => [newLog, ...prev]);

    if (!authorized) {
      addNotification(
        `PERINGATAN PRIVASI: ${readerName} mencoba mengakses koordinat "${plot.name}" milik ${farmer.name} tanpa izin/consent!`,
        'alert'
      );
    } else {
      addNotification(
        `NOTIFIKASI AKSES: ${readerName} mengakses Paspor Petani "${plot.name}" untuk "${purpose}".`,
        'info'
      );
    }

    return { authorized };
  };

  const triggerConsentRequest = (plotId: string, exporterName: string, bidPrice?: number) => {
    const exists = consentRequests.some(r => r.plotId === plotId && r.exporterName === exporterName);
    if (exists) {
      addNotification(`Permintaan akses ke ${exporterName} untuk plot ini sudah dikirim sebelumnya.`, 'warning');
      return;
    }

    const newReq: ConsentRequest = {
      id: `req-${Date.now()}`,
      plotId,
      exporterName,
      status: 'diminta',
      requestedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      bidPrice,
      bidStatus: bidPrice ? 'pending' : 'none'
    };

    setConsentRequests(prev => [newReq, ...prev]);
    if (bidPrice) {
      addNotification(`Penawaran harga Rp ${bidPrice.toLocaleString('id-ID')}/Kg diajukan bersama permintaan izin oleh ${exporterName}.`, 'info');
    } else {
      addNotification(`Permintaan izin akses data baru diajukan oleh ${exporterName}.`, 'info');
    }
  };

  const updateConsentRequest = (id: string, status: 'disetujui' | 'ditolak', negotiatedPrice?: number) => {
    setConsentRequests(prev => prev.map(req => {
      if (req.id !== id) return req;

      const plot = plots.find(p => p.id === req.plotId);
      const plotName = plot ? plot.name : 'kebun';
      
      let finalBidStatus: ConsentRequest['bidStatus'] = req.bidStatus;
      if (req.bidPrice) {
        if (negotiatedPrice) {
          finalBidStatus = 'nego';
          addNotification(
            `Nego Harga: Petani mengusulkan harga tanding Rp ${negotiatedPrice.toLocaleString('id-ID')}/Kg untuk kebun "${plotName}".`,
            'info'
          );
        } else {
          finalBidStatus = status === 'disetujui' ? 'diterima' : 'ditolak';
        }
      }

      addNotification(
        `Izin akses ke ${req.exporterName} untuk kebun "${plotName}" telah ${status === 'disetujui' ? 'DIBERIKAN' : 'DITOLAK'} oleh Petani.`,
        status === 'disetujui' ? 'success' : 'warning'
      );

      return {
        ...req,
        status,
        bidStatus: finalBidStatus,
        negotiatedPrice: negotiatedPrice || req.negotiatedPrice,
        respondedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };
    }));
  };

  const resetToDefault = () => {
    localStorage.removeItem('paspor_petani_list');
    localStorage.removeItem('paspor_petani_plots');
    localStorage.removeItem('paspor_petani_consents');
    localStorage.removeItem('paspor_petani_access_logs');
    localStorage.removeItem('paspor_petani_notifications');
    setPetaniList(DEFAULT_PETANI);
    setPlots(DEFAULT_PLOTS(DEFAULT_PETANI));
    setConsentRequests(DEFAULT_CONSENTS);
    setAccessLogs(DEFAULT_ACCESS_LOGS);
    setNotifications(DEFAULT_NOTIFICATIONS);
    addNotification('Database demonstrasi berhasil diatur ulang ke kondisi awal.', 'success');
  };

  return (
    <AppContext.Provider
      value={{
        currentRole,
        activePetaniId,
        petaniList,
        plots,
        consentRequests,
        accessLogs,
        notifications,
        isOnline,
        setRole,
        setActivePetaniId,
        addPetani,
        addPlot,
        updatePlot,
        verifyPlotHash,
        tamperPlotData,
        simulateAccessPlot,
        updateConsentRequest,
        triggerConsentRequest,
        toggleOnlineStatus,
        addNotification,
        clearNotifications,
        resetToDefault,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
