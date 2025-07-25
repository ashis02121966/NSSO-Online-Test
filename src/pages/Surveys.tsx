import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { Modal } from '../components/UI/Modal';
import { surveyApi } from '../services/api';
import { Survey } from '../types';
import { Plus, Search, Edit, Trash2, Calendar, Clock, Users, Target, Eye, Copy, ToggleLeft, ToggleRight, FileText } from 'lucide-react';
import { formatDate, formatDuration } from '../utils';

export function Surveys() {
  const { user } = useAuth();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetDate: '',
    duration: 35,
    totalQuestions: 30,
    passingScore: 70,
    maxAttempts: 3
  });

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      setIsLoading(true);
      const response = await surveyApi.getSurveys();
      setSurveys(response.data || []);
    } catch (error) {
      console.error('Failed to fetch surveys:', error);
      setSurveys([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSurvey = async () => {
    if (!formData.title || !formData.description || !formData.targetDate) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      const response = await surveyApi.createSurvey({
        ...formData,
        targetDate: new Date(formData.targetDate),
        createdBy: user?.id || '550e8400-e29b-41d4-a716-446655440010'
      });
      if (response.success && response.data) {
        setSurveys([...surveys, response.data]);
        setIsCreateModalOpen(false);
        resetForm();
        alert('Survey created successfully!');
      } else {
        alert(`Failed to create survey: ${response.message}`);
      }
    } catch (error) {
      console.error('Failed to create survey:', error);
      alert('Failed to create survey. Please try again.');
    }
  };

  const handleEditSurvey = async () => {
    if (!selectedSurvey) return;
    
    if (!formData.title || !formData.description || !formData.targetDate) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      const response = await surveyApi.updateSurvey(selectedSurvey.id, {
        ...formData,
        targetDate: new Date(formData.targetDate)
      });
      if (response.success && response.data) {
        setSurveys(surveys.map(survey => 
          survey.id === selectedSurvey.id ? response.data! : survey
        ));
        setIsEditModalOpen(false);
        resetForm();
        alert('Survey updated successfully!');
      } else {
        alert(`Failed to update survey: ${response.message}`);
      }
    } catch (error) {
      console.error('Failed to update survey:', error);
      alert('Failed to update survey. Please try again.');
    }
  };

  const handleDeleteSurvey = async (surveyId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this survey? This will also delete all associated questions and results. This action cannot be undone.')) {
      try {
        const response = await surveyApi.deleteSurvey(surveyId);
        if (response.success) {
          setSurveys(surveys.filter(survey => survey.id !== surveyId));
          alert('Survey deleted successfully!');
        } else {
          alert(`Failed to delete survey: ${response.message}`);
        }
      } catch (error) {
        console.error('Failed to delete survey:', error);
        alert('Failed to delete survey. Please try again.');
      }
    }
  };

  const handleToggleStatus = async (surveyId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const survey = surveys.find(s => s.id === surveyId);
    if (!survey) return;
    
    try {
      const response = await surveyApi.updateSurvey(surveyId, {
        ...survey,
        isActive: !survey.isActive
      });
      if (response.success && response.data) {
        setSurveys(surveys.map(s => 
          s.id === surveyId ? { ...s, isActive: !s.isActive } : s
        ));
        alert(`Survey ${!survey.isActive ? 'activated' : 'deactivated'} successfully!`);
      } else {
        alert(`Failed to update survey status: ${response.message}`);
      }
    } catch (error) {
      console.error('Failed to toggle survey status:', error);
      alert('Failed to update survey status. Please try again.');
    }
  };

  const handleDuplicateSurvey = async (survey: Survey, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const duplicateData = {
        title: `${survey.title} (Copy)`,
        description: survey.description,
        targetDate: survey.targetDate,
        duration: survey.duration,
        totalQuestions: survey.totalQuestions,
        passingScore: survey.passingScore,
        maxAttempts: survey.maxAttempts,
        createdBy: user?.id || '550e8400-e29b-41d4-a716-446655440010'
      };
      
      const response = await surveyApi.createSurvey(duplicateData);
      if (response.success && response.data) {
        setSurveys([...surveys, response.data]);
        alert('Survey duplicated successfully!');
      } else {
        alert(`Failed to duplicate survey: ${response.message}`);
      }
    } catch (error) {
      console.error('Failed to duplicate survey:', error);
      alert('Failed to duplicate survey. Please try again.');
    }
  };

  const openEditModal = (survey: Survey, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Handle potentially invalid date
    const dateObj = new Date(survey.targetDate);
    const targetDateString = isNaN(dateObj.getTime()) ? '' : dateObj.toISOString().split('T')[0];
    
    setSelectedSurvey(survey);
    setFormData({
      title: survey.title,
      description: survey.description,
      targetDate: targetDateString,
      duration: survey.duration,
      totalQuestions: survey.totalQuestions,
      passingScore: survey.passingScore,
      maxAttempts: survey.maxAttempts
    });
    setIsEditModalOpen(true);
  };
  
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      targetDate: '',
      duration: 35,
      totalQuestions: 30,
      passingScore: 70,
      maxAttempts: 3
    });
    setSelectedSurvey(null);
  };

  const filteredSurveys = surveys.filter(survey =>
    survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    survey.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Survey Management</h1>
            <p className="text-gray-600 mt-2">Create and manage your surveys and assessments</p>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Survey</span>
          </Button>
        </div>

        <Card>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search surveys..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading surveys...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Survey</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Questions</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Duration</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Target Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Pass Score</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSurveys.map((survey) => (
                    <tr key={survey.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{survey.title}</p>
                          <p className="text-sm text-gray-500 line-clamp-1">{survey.description}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          survey.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {survey.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-900">{survey.totalQuestions}</td>
                      <td className="py-3 px-4 text-gray-900">{formatDuration(survey.duration)}</td>
                      <td className="py-3 px-4 text-gray-900">{formatDate(survey.targetDate)}</td>
                      <td className="py-3 px-4 text-gray-900">{survey.passingScore}%</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => openEditModal(survey, e)}
                            className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                            title="Edit Survey"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDuplicateSurvey(survey, e)}
                            className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
                            title="Duplicate Survey"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleToggleStatus(survey.id, e)}
                            className={`p-1.5 hover:bg-gray-50 rounded-md transition-colors ${
                              survey.isActive ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'
                            }`}
                            title={survey.isActive ? 'Deactivate Survey' : 'Activate Survey'}
                          >
                            {survey.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('View details for survey:', survey.id);
                            }}
                            className="p-1.5 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteSurvey(survey.id, e)}
                            className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete Survey"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredSurveys.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Surveys Found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'No surveys match your search criteria.' : 'Get started by creating your first survey.'}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Survey</span>
                </Button>
              )}
            </div>
          )}
        </Card>

        {/* Create Survey Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            resetForm();
          }}
          title="Create New Survey"
          size="lg"
        >
          <div className="space-y-4">
            <Input
              label="Survey Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter survey title"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter survey description"
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Target Date"
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              />
              <Input
                label="Duration (minutes)"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                min="1"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Total Questions"
                type="number"
                value={formData.totalQuestions}
                onChange={(e) => setFormData({ ...formData, totalQuestions: parseInt(e.target.value) })}
                min="1"
              />
              <Input
                label="Passing Score (%)"
                type="number"
                value={formData.passingScore}
                onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) })}
                min="1"
                max="100"
              />
              <Input
                label="Max Attempts"
                type="number"
                value={formData.maxAttempts}
                onChange={(e) => setFormData({ ...formData, maxAttempts: parseInt(e.target.value) })}
                min="1"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateSurvey}>
                Create Survey
              </Button>
            </div>
          </div>
        </Modal>

        {/* Edit Survey Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            resetForm();
          }}
          title="Edit Survey"
          size="lg"
        >
          <div className="space-y-4">
            <Input
              label="Survey Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter survey title"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter survey description"
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Target Date"
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              />
              <Input
                label="Duration (minutes)"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                min="1"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Total Questions"
                type="number"
                value={formData.totalQuestions}
                onChange={(e) => setFormData({ ...formData, totalQuestions: parseInt(e.target.value) })}
                min="1"
              />
              <Input
                label="Passing Score (%)"
                type="number"
                value={formData.passingScore}
                onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) })}
                min="1"
                max="100"
              />
              <Input
                label="Max Attempts"
                type="number"
                value={formData.maxAttempts}
                onChange={(e) => setFormData({ ...formData, maxAttempts: parseInt(e.target.value) })}
                min="1"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsEditModalOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleEditSurvey}>
                Update Survey
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}