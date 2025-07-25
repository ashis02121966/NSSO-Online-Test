import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout/Layout';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { Modal } from '../components/UI/Modal';
import { settingsApi } from '../services/api';
import { SystemSettings } from '../types';
import { Settings as SettingsIcon, Save, RefreshCw, Edit, Database, Mail, Shield, Globe, Clock, Users, Award } from 'lucide-react';
import { formatDateTime } from '../utils';

export function Settings() {
  const [settings, setSettings] = useState<SystemSettings[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSetting, setSelectedSetting] = useState<SystemSettings | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await settingsApi.getSettings();
      if (response.success && response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSetting = async () => {
    if (!selectedSetting) return;
    
    try {
      const response = await settingsApi.updateSetting(selectedSetting.id, editValue);
      if (response.success) {
        setSettings(settings.map(setting => 
          setting.id === selectedSetting.id 
            ? { ...setting, value: editValue, updatedAt: new Date() }
            : setting
        ));
        setIsEditModalOpen(false);
        setSelectedSetting(null);
        setEditValue('');
        setHasChanges(true);
      }
    } catch (error) {
      console.error('Failed to update setting:', error);
    }
  };

  const openEditModal = (setting: SystemSettings) => {
    setSelectedSetting(setting);
    setEditValue(setting.value);
    setIsEditModalOpen(true);
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'general':
        return <Globe className="w-5 h-5 text-purple-600" />;
      case 'test':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'security':
        return <Shield className="w-5 h-5 text-red-600" />;
      default:
        return <SettingsIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, SystemSettings[]>);

  const renderSettingValue = (setting: SystemSettings) => {
    switch (setting.type) {
      case 'boolean':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            setting.value === 'true' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {setting.value === 'true' ? 'Enabled' : 'Disabled'}
          </span>
        );
      case 'number':
        return <span className="font-mono text-sm font-medium text-blue-600">{setting.value}</span>;
      case 'color':
        return (
          <div className="flex items-center space-x-2">
            <div 
              className="w-6 h-6 rounded border border-gray-300" 
              style={{ backgroundColor: setting.value }}
            ></div>
            <span className="font-mono text-sm">{setting.value}</span>
          </div>
        );
      case 'json':
        return <span className="font-mono text-xs text-gray-600 truncate">{setting.value}</span>;
      default:
        return <span className="text-sm font-medium">{setting.value}</span>;
    }
  };

  const renderEditInput = () => {
    if (!selectedSetting) return null;

    switch (selectedSetting.type) {
      case 'boolean':
        return (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        );
      case 'number':
        return (
          <Input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="Enter number value"
          />
        );
      case 'color':
        return (
          <div className="space-y-2">
            <Input
              type="color"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="h-12"
            />
            <Input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Enter hex color code"
            />
          </div>
        );
      case 'email':
        return (
          <Input
            type="email"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="Enter email address"
          />
        );
      case 'url':
        return (
          <Input
            type="url"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="Enter URL"
          />
        );
      case 'select':
        const selectOptions = selectedSetting.options || [];
        return (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {selectOptions.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      case 'json':
        return (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="Enter JSON value"
            rows={6}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
          />
        );
      default:
        return (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="Enter value"
          />
        );
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
            <p className="text-gray-600 mt-2">Configure system-wide settings and preferences</p>
          </div>
          <div className="flex items-center space-x-3">
            {hasChanges && (
              <div className="flex items-center space-x-2 text-green-600">
                <Save className="w-4 h-4" />
                <span className="text-sm">Changes saved</span>
              </div>
            )}
            <Button
              variant="secondary"
              onClick={fetchSettings}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading settings...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedSettings).map(([category, categorySettings]) => (
              <Card key={category}>
                <div className="flex items-center space-x-3 mb-6">
                  {getCategoryIcon(category)}
                  <h2 className="text-xl font-semibold text-gray-900 capitalize">{category} Settings</h2>
                </div>
                
                <div className="space-y-4">
                  {categorySettings.map((setting) => (
                    <div key={setting.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-medium text-gray-900">{setting.key}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            setting.type === 'boolean' ? 'bg-green-100 text-green-700' :
                            setting.type === 'number' ? 'bg-blue-100 text-blue-700' :
                            setting.type === 'color' ? 'bg-purple-100 text-purple-700' :
                            setting.type === 'email' ? 'bg-teal-100 text-teal-700' :
                            setting.type === 'url' ? 'bg-indigo-100 text-indigo-700' :
                            setting.type === 'json' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {setting.type}
                          </span>
                          {!setting.isEditable && (
                            <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                              Read Only
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                        <div className="mt-2">
                          {renderSettingValue(setting)}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Last updated: {formatDateTime(setting.updatedAt)}
                          {setting.updatedBy && ` by ${setting.updatedBy}`}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {setting.isEditable ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openEditModal(setting)}
                            className="flex items-center space-x-2"
                          >
                            <Edit className="w-4 h-4" />
                            <span>Edit</span>
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-500 px-3 py-1 bg-gray-100 rounded-full">
                            Read Only
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Setting Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedSetting(null);
            setEditValue('');
          }}
          title="Edit Setting"
        >
          {selectedSetting && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{selectedSetting.key}</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedSetting.description}</p>
                <div className="mt-2 flex items-center space-x-2">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {selectedSetting.type}
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                    {selectedSetting.category}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Value
                </label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  {renderSettingValue(selectedSetting)}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Value
                </label>
                {renderEditInput()}
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedSetting(null);
                    setEditValue('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateSetting}
                  disabled={editValue === selectedSetting.value}
                >
                  Update Setting
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
}