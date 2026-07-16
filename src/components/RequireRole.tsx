import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext, type Role } from '../context/AppContext';

interface RequireRoleProps {
  role: Role;
  children: ReactNode;
}

export default function RequireRole({ role, children }: RequireRoleProps) {
  const { currentRole } = useAppContext();
  if (currentRole !== role) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
