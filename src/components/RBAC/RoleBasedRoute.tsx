import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredLevel?: number;
  redirectTo?: string;
}

export function RoleBasedRoute({ 
  children, 
  requiredRoles = [], 
  requiredLevel,
  redirectTo = '/unauthorized' 
}: RoleBasedRouteProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user.role.name;
  const userLevel = user.role.level;

  // Check role-based access
  const hasRoleAccess = requiredRoles.length === 0 || requiredRoles.includes(userRole);

  // Check level-based access (lower numbers have higher access)
  const hasLevelAccess = !requiredLevel || userLevel <= requiredLevel;

  if (hasRoleAccess && hasLevelAccess) {
    return <>{children}</>;
  }

  return <Navigate to={redirectTo} replace />;
}