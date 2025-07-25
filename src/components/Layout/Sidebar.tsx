import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, FileText, ClipboardList, 
  BarChart3, Award, Settings, HelpCircle, Book,
  UserCheck, Shield, Target, Eye, Building, MapPin,
  BookOpen, Trophy, TrendingUp, Timer, Menu
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Define menu items with role-based access control
interface MenuItem {
  to: string;
  icon: any;
  label: string;
  roles: string[]; // Roles that can access this menu item
  level?: number; // Minimum role level required
}

const allMenuItems: MenuItem[] = [
  // Admin only items
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['Admin'], level: 1 },
  { to: '/users', icon: Users, label: 'User Management', roles: ['Admin'], level: 1 },
  { to: '/roles', icon: Shield, label: 'Role Management', roles: ['Admin'], level: 1 },
  { to: '/role-menu-management', icon: Menu, label: 'Menu Access Control', roles: ['Admin'], level: 1 },
  { to: '/surveys', icon: FileText, label: 'Survey Management', roles: ['Admin'], level: 1 },
  { to: '/questions', icon: Book, label: 'Question Bank', roles: ['Admin'], level: 1 },
  { to: '/settings', icon: Settings, label: 'System Settings', roles: ['Admin'], level: 1 },
  
  // ZO User items
  { to: '/zo-dashboard', icon: LayoutDashboard, label: 'ZO Dashboard', roles: ['ZO User'], level: 2 },
  { to: '/zone-performance', icon: MapPin, label: 'Zone Performance', roles: ['ZO User'], level: 2 },
  { to: '/regional-overview', icon: Building, label: 'Regional Overview', roles: ['ZO User'], level: 2 },
  
  // RO User items
  { to: '/ro-dashboard', icon: LayoutDashboard, label: 'RO Dashboard', roles: ['RO User'], level: 3 },
  { to: '/district-performance', icon: Building, label: 'District Performance', roles: ['RO User'], level: 3 },
  { to: '/supervisor-teams', icon: UserCheck, label: 'Supervisor Teams', roles: ['RO User'], level: 3 },
  
  // Supervisor items
  { to: '/supervisor-dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['Supervisor'], level: 4 },
  { to: '/team-results', icon: BarChart3, label: 'Team Results', roles: ['Supervisor'], level: 4 },
  { to: '/my-enumerators', icon: UserCheck, label: 'My Enumerators', roles: ['Supervisor'], level: 4 },
  { to: '/assigned-surveys', icon: FileText, label: 'Assigned Surveys', roles: ['Supervisor'], level: 4 },
  
  // Enumerator items
  { to: '/enumerator-dashboard', icon: LayoutDashboard, label: 'My Dashboard', roles: ['Enumerator'], level: 5 },
  { to: '/available-tests', icon: BookOpen, label: 'Available Tests', roles: ['Enumerator'], level: 5 },
  { to: '/my-results', icon: TrendingUp, label: 'My Results', roles: ['Enumerator'], level: 5 },
  { to: '/my-certificates', icon: Trophy, label: 'My Certificates', roles: ['Enumerator'], level: 5 },
  { to: '/test-schedule', icon: Timer, label: 'Test Schedule', roles: ['Enumerator'], level: 5 },
  
  // Shared items (accessible by multiple roles)
  { to: '/results', icon: BarChart3, label: 'Results & Analytics', roles: ['Admin', 'ZO User', 'RO User', 'Supervisor'], level: 1 },
  { to: '/enumerator-status', icon: Eye, label: 'Enumerator Status', roles: ['Admin', 'ZO User', 'RO User', 'Supervisor'], level: 1 },
  { to: '/certificates', icon: Award, label: 'Certificates', roles: ['Admin', 'ZO User', 'RO User', 'Supervisor', 'Enumerator'], level: 1 }
];

// Legacy menu items structure for backward compatibility
const menuItems = {
  admin: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/users', icon: Users, label: 'User Management' },
    { to: '/roles', icon: Shield, label: 'Role Management' },
    { to: '/role-menu-management', icon: Menu, label: 'Menu Access Control' },
    { to: '/surveys', icon: FileText, label: 'Survey Management' },
    { to: '/questions', icon: Book, label: 'Question Bank' },
    { to: '/results', icon: BarChart3, label: 'Results & Analytics' },
    { to: '/enumerator-status', icon: Eye, label: 'Enumerator Status' },
    { to: '/certificates', icon: Award, label: 'Certificates' },
    { to: '/settings', icon: Settings, label: 'System Settings' }
  ],
  'zo user': [
    { to: '/zo-dashboard', icon: LayoutDashboard, label: 'ZO Dashboard' },
    { to: '/zone-performance', icon: MapPin, label: 'Zone Performance' },
    { to: '/regional-overview', icon: Building, label: 'Regional Overview' },
    { to: '/enumerator-status', icon: Eye, label: 'Enumerator Status' },
    { to: '/results', icon: BarChart3, label: 'Zone Analytics' },
    { to: '/certificates', icon: Award, label: 'Certificates' }
  ],
  'ro user': [
    { to: '/ro-dashboard', icon: LayoutDashboard, label: 'RO Dashboard' },
    { to: '/district-performance', icon: Building, label: 'District Performance' },
    { to: '/supervisor-teams', icon: UserCheck, label: 'Supervisor Teams' },
    { to: '/enumerator-status', icon: Eye, label: 'Enumerator Status' },
    { to: '/results', icon: BarChart3, label: 'Regional Analytics' },
    { to: '/certificates', icon: Award, label: 'Certificates' }
  ],
  supervisor: [
    { to: '/supervisor-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/team-results', icon: BarChart3, label: 'Team Results' },
    { to: '/my-enumerators', icon: UserCheck, label: 'My Enumerators' },
    { to: '/enumerator-status', icon: Eye, label: 'Team Status' },
    { to: '/assigned-surveys', icon: FileText, label: 'Assigned Surveys' },
    { to: '/certificates', icon: Award, label: 'Team Certificates' }
  ],
  enumerator: [
    { to: '/enumerator-dashboard', icon: LayoutDashboard, label: 'My Dashboard' },
    { to: '/available-tests', icon: BookOpen, label: 'Available Tests' },
    { to: '/my-results', icon: TrendingUp, label: 'My Results' },
    { to: '/my-certificates', icon: Trophy, label: 'My Certificates' },
    { to: '/test-schedule', icon: Timer, label: 'Test Schedule' }
  ]
};

export function Sidebar() {
  const { user } = useAuth();
  
  // Filter menu items based on user role and level
  const getAccessibleMenuItems = (): MenuItem[] => {
    if (!user) return [];
    
    const userRole = user.role.name;
    const userLevel = user.role.level;
    
    return allMenuItems.filter(item => {
      // Check if user's role is in the allowed roles for this menu item
      const hasRoleAccess = item.roles.includes(userRole);
      
      // Check if user's level meets the minimum requirement
      const hasLevelAccess = item.level ? userLevel <= item.level : true;
      
      return hasRoleAccess && hasLevelAccess;
    });
  };
  
  const accessibleItems = getAccessibleMenuItems();
  
  // Fallback to legacy system if no items found
  const roleKey = user?.role.name.toLowerCase().replace(' ', '_') as keyof typeof menuItems;
  const legacyItems = menuItems[roleKey] || menuItems.enumerator;
  
  // Use RBAC items if available, otherwise fallback to legacy
  const items = accessibleItems.length > 0 
    ? accessibleItems.map(item => ({ to: item.to, icon: item.icon, label: item.label }))
    : legacyItems;
  
  // Use items as final items since RBAC management is now included in the main list
  const finalItems = items;

  const getRoleIcon = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'admin':
        return 'bg-red-600';
      case 'zo user':
        return 'bg-purple-600';
      case 'ro user':
        return 'bg-indigo-600';
      case 'supervisor':
        return 'bg-green-600';
      case 'enumerator':
        return 'bg-blue-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getRoleDescription = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'admin':
        return 'Full System Access';
      case 'zo user':
        return 'Zone Level Access';
      case 'ro user':
        return 'Regional Access';
      case 'supervisor':
        return 'Team Management';
      case 'enumerator':
        return 'Test Access';
      default:
        return 'Limited Access';
    }
  };

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 ${getRoleIcon(user?.role.name || '')} rounded-lg flex items-center justify-center`}>
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">eSigma</h2>
            <p className="text-xs text-gray-400">Survey Platform</p>
          </div>
        </div>
        
        {/* User Info */}
        <div className="mt-4 p-3 bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-white">{user?.name}</p>
            <span className="px-2 py-1 bg-blue-600 text-xs rounded-full">{user?.role.level}</span>
          </div>
          <p className="text-xs text-gray-400">{user?.role.name}</p>
          <p className="text-xs text-gray-500">{getRoleDescription(user?.role.name || '')}</p>
          {user?.zone && (
            <p className="text-xs text-gray-400">{user.zone}</p>
          )}
          {user?.region && (
            <p className="text-xs text-gray-400">{user.region}</p>
          )}
          {user?.district && (
            <p className="text-xs text-gray-400">{user.district}</p>
          )}
        </div>
        
        {/* RBAC Status Indicator */}
        <div className="mt-3 p-2 bg-green-900 rounded-lg">
          <div className="flex items-center space-x-2">
            <Menu className="w-4 h-4 text-green-400" />
            <div>
              <p className="text-xs font-medium text-green-400">RBAC Active</p>
              <p className="text-xs text-green-300">{accessibleItems.length} menu items</p>
            </div>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-4 pb-4">
        <ul className="space-y-2">
          {finalItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-800">
        <button className="flex items-center space-x-3 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors w-full">
          <HelpCircle className="w-5 h-5" />
          <span>Help & Support</span>
        </button>
      </div>
    </aside>
  );
}