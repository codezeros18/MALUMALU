import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import type { Role } from '../types';

interface RequireRoleProps {
  role: Role;
  children: ReactNode;
}

export default function RequireRole({ role, children }: RequireRoleProps) {
  const { currentRole } = useAppContext();
  if (currentRole !== role) {
    return <Navigate to="/masuk" replace />;
  }
  return <>{children}</>;
}
