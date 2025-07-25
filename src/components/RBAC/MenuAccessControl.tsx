import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface MenuAccessControlProps {
  requiredRoles?: string[];
  requiredLevel?: number;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function MenuAccessControl({ 
  requiredRoles = [], 
  requiredLevel, 
  children, 
  fallback = null 
}: MenuAccessControlProps) {
  const { user } = useAuth();

  if (!user) {
    return <>{fallback}</>;
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

  return <>{fallback}</>;
}