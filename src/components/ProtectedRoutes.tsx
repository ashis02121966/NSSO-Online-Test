import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Dashboard } from '../pages/Dashboard';
import { ZODashboard } from '../pages/ZODashboard';
import { RODashboard } from '../pages/RODashboard';
import { SupervisorDashboard } from '../pages/SupervisorDashboard';
import { EnumeratorDashboard } from '../pages/EnumeratorDashboard';
import { TeamResults } from '../pages/TeamResults';
import { MyEnumerators } from '../pages/MyEnumerators';
import { Users } from '../pages/Users';
import { Roles } from '../pages/Roles';
import { Surveys } from '../pages/Surveys';
import { Questions } from '../pages/Questions';
import { Results } from '../pages/Results';
import { EnumeratorStatusPage } from '../pages/EnumeratorStatus';
import { Certificates } from '../pages/Certificates';
import { Settings } from '../pages/Settings';
import { AvailableTests } from '../pages/AvailableTests';
import { MyResults } from '../pages/MyResults';
import { MyCertificates } from '../pages/MyCertificates';
import { TestSchedule } from '../pages/TestSchedule';
import { TestInterface } from '../pages/TestInterface';
import { RoleMenuManagement } from '../pages/RoleMenuManagement';
import { Unauthorized } from '../pages/Unauthorized';
import { RoleBasedRoute } from './RBAC/RoleBasedRoute';

function DashboardRedirect() {
  const { user } = useAuth();

  const getDashboardRoute = () => {
    if (!user) return '/dashboard';
    
    console.log('Getting dashboard route for user role:', user.role.name);
    switch (user.role.name.toLowerCase()) {
      case 'admin':
        return '/dashboard';
      case 'zo user':
        return '/zo-dashboard';
      case 'ro user':
        return '/ro-dashboard';
      case 'supervisor':
        return '/supervisor-dashboard';
      case 'enumerator':
        return '/enumerator-dashboard';
      default:
        console.log('Unknown role, defaulting to dashboard');
        return '/dashboard';
    }
  };

  return <Navigate to={getDashboardRoute()} replace />;
}

export function ProtectedRoutes() {
  return (
    <Routes>
      {/* Admin Routes */}
      <Route path="/dashboard" element={
        <RoleBasedRoute requiredRoles={['Admin']}>
          <Dashboard />
        </RoleBasedRoute>
      } />
      <Route path="/users" element={
        <RoleBasedRoute requiredRoles={['Admin']}>
          <Users />
        </RoleBasedRoute>
      } />
      <Route path="/roles" element={
        <RoleBasedRoute requiredRoles={['Admin']}>
          <Roles />
        </RoleBasedRoute>
      } />
      <Route path="/role-menu-management" element={
        <RoleBasedRoute requiredRoles={['Admin']}>
          <RoleMenuManagement />
        </RoleBasedRoute>
      } />
      <Route path="/surveys" element={
        <RoleBasedRoute requiredRoles={['Admin']}>
          <Surveys />
        </RoleBasedRoute>
      } />
      <Route path="/questions" element={
        <RoleBasedRoute requiredRoles={['Admin']}>
          <Questions />
        </RoleBasedRoute>
      } />
      <Route path="/settings" element={
        <RoleBasedRoute requiredRoles={['Admin']}>
          <Settings />
        </RoleBasedRoute>
      } />

      {/* ZO Routes */}
      <Route path="/zo-dashboard" element={
        <RoleBasedRoute requiredRoles={['ZO User']}>
          <ZODashboard />
        </RoleBasedRoute>
      } />

      {/* RO Routes */}
      <Route path="/ro-dashboard" element={
        <RoleBasedRoute requiredRoles={['RO User']}>
          <RODashboard />
        </RoleBasedRoute>
      } />

      {/* Supervisor Routes */}
      <Route path="/supervisor-dashboard" element={
        <RoleBasedRoute requiredRoles={['Supervisor']}>
          <SupervisorDashboard />
        </RoleBasedRoute>
      } />
      <Route path="/team-results" element={
        <RoleBasedRoute requiredRoles={['Supervisor']}>
          <TeamResults />
        </RoleBasedRoute>
      } />
      <Route path="/my-enumerators" element={
        <RoleBasedRoute requiredRoles={['Supervisor']}>
          <MyEnumerators />
        </RoleBasedRoute>
      } />

      {/* Enumerator Routes */}
      <Route path="/enumerator-dashboard" element={
        <RoleBasedRoute requiredRoles={['Enumerator']}>
          <EnumeratorDashboard />
        </RoleBasedRoute>
      } />
      <Route path="/available-tests" element={
        <RoleBasedRoute requiredRoles={['Enumerator']}>
          <AvailableTests />
        </RoleBasedRoute>
      } />
      <Route path="/my-results" element={
        <RoleBasedRoute requiredRoles={['Enumerator']}>
          <MyResults />
        </RoleBasedRoute>
      } />
      <Route path="/my-certificates" element={
        <RoleBasedRoute requiredRoles={['Enumerator']}>
          <MyCertificates />
        </RoleBasedRoute>
      } />
      <Route path="/test-schedule" element={
        <RoleBasedRoute requiredRoles={['Enumerator']}>
          <TestSchedule />
        </RoleBasedRoute>
      } />

      {/* Test Interface */}
      <Route path="/test/:sessionId" element={
        <RoleBasedRoute requiredRoles={['Enumerator']}>
          <TestInterface />
        </RoleBasedRoute>
      } />

      {/* Shared Routes */}
      <Route path="/results" element={
        <RoleBasedRoute requiredRoles={['Admin', 'ZO User', 'RO User', 'Supervisor']}>
          <Results />
        </RoleBasedRoute>
      } />
      <Route path="/enumerator-status" element={
        <RoleBasedRoute requiredRoles={['Admin', 'ZO User', 'RO User', 'Supervisor']}>
          <EnumeratorStatusPage />
        </RoleBasedRoute>
      } />
      <Route path="/certificates" element={
        <RoleBasedRoute requiredRoles={['Admin', 'ZO User', 'RO User', 'Supervisor', 'Enumerator']}>
          <Certificates />
        </RoleBasedRoute>
      } />

      {/* Unauthorized page */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route path="/" element={<DashboardRedirect />} />
    </Routes>
  );
}