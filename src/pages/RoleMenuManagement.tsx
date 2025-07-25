import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout/Layout';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { Modal } from '../components/UI/Modal';
import { roleApi } from '../services/api';
import { Role } from '../types';
import { Shield, Menu, Save, Eye, Edit, CheckCircle, X, Plus, Minus } from 'lucide-react';

// Available menu items that can be assigned to roles
const availableMenuItems = [
  { path: '/dashboard', label: 'Admin Dashboard', category: 'Dashboard', level: 1 },
  { path: '/users', label: 'User Management', category: 'Administration', level: 1 },
  { path: '/roles', label: 'Role Management', category: 'Administration', level: 1 },
  { path: '/surveys', label: 'Survey Management', category: 'Content', level: 1 },
  { path: '/questions', label: 'Question Bank', category: 'Content', level: 1 },
  { path: '/settings', label: 'System Settings', category: 'Administration', level: 1 },
  
  { path: '/zo-dashboard', label: 'ZO Dashboard', category: 'Dashboard', level: 2 },
  { path: '/zone-performance', label: 'Zone Performance', category: 'Analytics', level: 2 },
  { path: '/regional-overview', label: 'Regional Overview', category: 'Analytics', level: 2 },
  
  { path: '/ro-dashboard', label: 'RO Dashboard', category: 'Dashboard', level: 3 },
  { path: '/district-performance', label: 'District Performance', category: 'Analytics', level: 3 },
  { path: '/supervisor-teams', label: 'Supervisor Teams', category: 'Management', level: 3 },
  
  { path: '/supervisor-dashboard', label: 'Supervisor Dashboard', category: 'Dashboard', level: 4 },
  { path: '/team-results', label: 'Team Results', category: 'Analytics', level: 4 },
  { path: '/my-enumerators', label: 'My Enumerators', category: 'Management', level: 4 },
  { path: '/assigned-surveys', label: 'Assigned Surveys', category: 'Content', level: 4 },
  
  { path: '/enumerator-dashboard', label: 'My Dashboard', category: 'Dashboard', level: 5 },
  { path: '/available-tests', label: 'Available Tests', category: 'Testing', level: 5 },
  { path: '/my-results', label: 'My Results', category: 'Testing', level: 5 },
  { path: '/my-certificates', label: 'My Certificates', category: 'Testing', level: 5 },
  { path: '/test-schedule', label: 'Test Schedule', category: 'Testing', level: 5 },
  
  // Shared items
  { path: '/results', label: 'Results & Analytics', category: 'Analytics', level: 1 },
  { path: '/enumerator-status', label: 'Enumerator Status', category: 'Monitoring', level: 1 },
  { path: '/certificates', label: 'Certificates', category: 'Certificates', level: 1 }
];

export function RoleMenuManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [menuAccess, setMenuAccess] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      const response = await roleApi.getRoles();
      setRoles(response.data);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (role: Role) => {
    setSelectedRole(role);
    setMenuAccess(role.menuAccess || []);
    setIsEditModalOpen(true);
  };

  const handleSaveMenuAccess = async () => {
    if (!selectedRole) return;

    try {
      setIsSaving(true);
      const response = await roleApi.updateRoleMenuAccess(selectedRole.id, menuAccess);
      if (response.success) {
        setRoles(roles.map(role => 
          role.id === selectedRole.id 
            ? { ...role, menuAccess }
            : role
        ));
        setIsEditModalOpen(false);
        setSelectedRole(null);
        setMenuAccess([]);
      }
    } catch (error) {
      console.error('Failed to update menu access:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleMenuAccess = (menuPath: string) => {
    setMenuAccess(prev => 
      prev.includes(menuPath)
        ? prev.filter(path => path !== menuPath)
        : [...prev, menuPath]
    );
  };

  const addAllMenusForLevel = (level: number) => {
    const levelMenus = availableMenuItems
      .filter(item => item.level >= level)
      .map(item => item.path);
    
    setMenuAccess(prev => {
      const newAccess = [...prev];
      levelMenus.forEach(path => {
        if (!newAccess.includes(path)) {
          newAccess.push(path);
        }
      });
      return newAccess;
    });
  };

  const removeAllMenusForLevel = (level: number) => {
    const levelMenus = availableMenuItems
      .filter(item => item.level === level)
      .map(item => item.path);
    
    setMenuAccess(prev => prev.filter(path => !levelMenus.includes(path)));
  };

  const filteredMenuItems = availableMenuItems.filter(item => {
    const matchesSearch = item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.path.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const groupedMenuItems = filteredMenuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof availableMenuItems>);

  const categories = [...new Set(availableMenuItems.map(item => item.category))];

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Role-Based Menu Access Control</h1>
            <p className="text-gray-600 mt-2">Configure menu access permissions for each role</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              RBAC Enabled
            </div>
          </div>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-32 bg-gray-200 rounded"></div>
              </Card>
            ))
          ) : (
            roles.map((role) => (
              <Card key={role.id} className="hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      role.level === 1 ? 'bg-red-100' :
                      role.level === 2 ? 'bg-purple-100' :
                      role.level === 3 ? 'bg-indigo-100' :
                      role.level === 4 ? 'bg-green-100' :
                      'bg-blue-100'
                    }`}>
                      <Shield className={`w-5 h-5 ${
                        role.level === 1 ? 'text-red-600' :
                        role.level === 2 ? 'text-purple-600' :
                        role.level === 3 ? 'text-indigo-600' :
                        role.level === 4 ? 'text-green-600' :
                        'text-blue-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                      <span className="text-xs text-gray-500">Level {role.level}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    role.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {role.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-4">{role.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Menu Items:</span>
                    <span className="font-medium">{role.menuAccess?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Users:</span>
                    <span className="font-medium">{role.userCount || 0}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {(role.menuAccess || []).slice(0, 2).map((path) => {
                      const menuItem = availableMenuItems.find(item => item.path === path);
                      return (
                        <span
                          key={path}
                          className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                        >
                          {menuItem?.label || path}
                        </span>
                      );
                    })}
                    {(role.menuAccess?.length || 0) > 2 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{(role.menuAccess?.length || 0) - 2} more
                      </span>
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openEditModal(role)}
                    className="flex items-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Configure</span>
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Menu Access Configuration Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedRole(null);
            setMenuAccess([]);
          }}
          title={`Configure Menu Access: ${selectedRole?.name}`}
          size="xl"
        >
          {selectedRole && (
            <div className="space-y-6">
              {/* Role Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">{selectedRole.name}</h3>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    Level {selectedRole.level}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{selectedRole.description}</p>
                <div className="mt-2 flex items-center space-x-4 text-sm">
                  <span className="text-gray-500">Users: {selectedRole.userCount || 0}</span>
                  <span className="text-gray-500">Selected Menus: {menuAccess.length}</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => addAllMenusForLevel(selectedRole.level)}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Level {selectedRole.level}+ Menus</span>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setMenuAccess([])}
                    className="flex items-center space-x-2"
                  >
                    <Minus className="w-4 h-4" />
                    <span>Clear All</span>
                  </Button>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Input
                      placeholder="Search menus..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-48"
                    />
                  </div>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Menu Items by Category */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {Object.entries(groupedMenuItems).map(([category, items]) => (
                  <div key={category} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{category}</h4>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            const categoryPaths = items.map(item => item.path);
                            setMenuAccess(prev => [...new Set([...prev, ...categoryPaths])]);
                          }}
                          className="text-xs"
                        >
                          Select All
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            const categoryPaths = items.map(item => item.path);
                            setMenuAccess(prev => prev.filter(path => !categoryPaths.includes(path)));
                          }}
                          className="text-xs"
                        >
                          Deselect All
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {items.map((item) => {
                        const isSelected = menuAccess.includes(item.path);
                        const isRecommended = item.level >= selectedRole.level;
                        
                        return (
                          <label
                            key={item.path}
                            className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                              isSelected 
                                ? 'bg-blue-50 border border-blue-200' 
                                : 'hover:bg-gray-50 border border-transparent'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleMenuAccess(item.path)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-900">{item.label}</span>
                                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                  L{item.level}
                                </span>
                                {isRecommended && (
                                  <span className="px-1.5 py-0.5 bg-green-100 text-green-600 text-xs rounded">
                                    Recommended
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 font-mono">{item.path}</div>
                            </div>
                            {isSelected && (
                              <CheckCircle className="w-4 h-4 text-blue-600" />
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Access Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {categories.map(category => {
                    const categoryItems = availableMenuItems.filter(item => item.category === category);
                    const selectedInCategory = menuAccess.filter(path => 
                      categoryItems.some(item => item.path === path)
                    ).length;
                    
                    return (
                      <div key={category} className="text-center">
                        <p className="font-medium text-blue-900">{selectedInCategory}/{categoryItems.length}</p>
                        <p className="text-blue-700">{category}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedRole(null);
                    setMenuAccess([]);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveMenuAccess}
                  loading={isSaving}
                  className="flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Menu Access</span>
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
}