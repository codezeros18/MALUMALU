import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext, type Role } from '../context/AppContext';
import { APP_LOCKED } from '../lib/appLock';

interface RequireRoleProps {
  role: Role;
  children: ReactNode;
}

export default function RequireRole({ role, children }: RequireRoleProps) {
  const { currentRole } = useAppContext();
  // Saat demo publik dikunci, jangan percaya currentRole yang mungkin sudah tersimpan
  // di localStorage dari sesi sebelum lock dinyalakan -- selalu lempar ke /masuk.
  if (APP_LOCKED || currentRole !== role) {
    return <Navigate to="/masuk" replace />;
  }
  return <>{children}</>;
}
