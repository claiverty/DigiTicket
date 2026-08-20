import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import type { Role } from '../types/auth';

interface RoleRouteProps {
  allowedRoles: Role[];
}

export function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/perfil" replace />;
  }

  return <Outlet />;
}
