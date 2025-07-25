import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout/Layout';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { Modal } from '../components/UI/Modal';
import { supervisorDashboardApi } from '../services/api';
import { EnumeratorStatus, EnumeratorSurveyStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { User, Target, Award, Calendar, Clock, CheckCircle, XCircle, AlertTriangle, Eye, Filter, Download, Search, Phone, Mail, MapPin } from 'lucide-react';
import { formatDateTime, formatDate, getScoreColor } from '../utils';

export function MyEnumerators() {
  const [enumerators, setEnumerators] = useState<EnumeratorStatus[]>([]);
  const [selectedEnumerator, setSelectedEnumerator] = useState<EnumeratorStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [progressFilter, setProgressFilter] = useState('all');

  useEffect(() => {
    fetchEnumerators();
  }, []);

  const fetchEnumerators = async () => {
    try {
      setIsLoading(true);
      const response = await supervisorDashboardApi.getDashboardData('30');
      if (response.success && response.data) {
        setEnumerators(response.data.enumeratorStatus);
      }
    } catch (error) {
      console.error('Failed to fetch enumerators:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openDetailModal = (enumerator: EnumeratorStatus) => {
    setSelectedEnumerator(enumerator);
    setIsDetailModalOpen(true);
  };

  const getStatusIcon = (status: EnumeratorSurveyStatus['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'expired':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: EnumeratorSurveyStatus['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOverallStatus = (enumerator: EnumeratorStatus) => {
    const totalSurveys = enumerator.surveys.length;
    const completedSurveys = enumerator.surveys.filter(s => s.status === 'completed').length;
    const failedSurveys = enumerator.surveys.filter(s => s.status === 'failed').length;
    const expiredSurveys = enumerator.surveys.filter(s => s.status === 'expired').length;

    if (completedSurveys === totalSurveys) return 'excellent';
    if (failedSurveys > 0 || expiredSurveys > 0) return 'needs_attention';
    if (completedSurveys > totalSurveys / 2) return 'good';
    return 'poor';
  };

  const filteredEnumerators = enumerators.filter(enumerator => {
    const matchesSearch = enumerator.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         enumerator.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const overallStatus = getOverallStatus(enumerator);
    const matchesStatus = statusFilter === 'all' || overallStatus === statusFilter;
    
    let matchesProgress = true;
    if (progressFilter !== 'all') {
      switch (progressFilter) {
        case 'completed':
          matchesProgress = enumerator.overallProgress === 100;
          break;
        case 'in_progress':
          matchesProgress = enumerator.overallProgress > 0 && enumerator.overallProgress < 100;
          break;
        case 'not_started':
          matchesProgress = enumerator.overallProgress === 0;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesProgress;
  });

  const overallStats = {
    totalEnumerators: enumerators.length,
    completedAll: enumerators.filter(e => e.overallProgress === 100).length,
    inProgress: enumerators.filter(e => e.overallProgress > 0 && e.overallProgress < 100).length,
    notStarted: enumerators.filter(e => e.overallProgress === 0).length,
    averageProgress: enumerators.reduce((sum, e) => sum + e.overallProgress, 0) / enumerators.length || 0,
    totalCertificates: enumerators.reduce((sum, e) => sum + e.totalCertificates, 0)
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Enumerators</h1>
            <p className="text-gray-600 mt-2">Manage and monitor your team members' progress</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="secondary" className="flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>Advanced Filters</span>
            </Button>
            <Button className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </Button>
          </div>
        </div>

        {/* Overall Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-3xl font-bold text-blue-600">{overallStats.totalEnumerators}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <User className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-green-600">{overallStats.completedAll}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-3xl font-bold text-yellow-600">{overallStats.inProgress}</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Not Started</p>
                <p className="text-3xl font-bold text-red-600">{overallStats.notStarted}</p>
              </div>
              <div className="p-3 rounded-full bg-red-100">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Progress</p>
                <p className="text-3xl font-bold text-purple-600">{overallStats.averageProgress.toFixed(1)}%</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Certificates</p>
                <p className="text-3xl font-bold text-indigo-600">{overallStats.totalCertificates}</p>
              </div>
              <div className="p-3 rounded-full bg-indigo-100">
                <Award className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Progress Chart */}
        <Card className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Progress Overview</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={enumerators.map(e => ({
                name: e.user.name.split(' ')[0],
                progress: e.overallProgress,
                certificates: e.totalCertificates
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value, name) => [
                  name === 'progress' ? `${value}%` : value,
                  name === 'progress' ? 'Progress' : 'Certificates'
                ]} />
                <Bar dataKey="progress" fill="#3B82F6" name="progress" />
                <Bar dataKey="certificates" fill="#10B981" name="certificates" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search enumerators..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="needs_attention">Needs Attention</option>
                <option value="poor">Poor</option>
              </select>
              <select
                value={progressFilter}
                onChange={(e) => setProgressFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Progress</option>
                <option value="completed">Completed (100%)</option>
                <option value="in_progress">In Progress</option>
                <option value="not_started">Not Started</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Enumerator List */}
        <Card>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading enumerators...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEnumerators.map((enumerator) => {
                const overallStatus = getOverallStatus(enumerator);
                const completedSurveys = enumerator.surveys.filter(s => s.status === 'completed').length;
                const totalSurveys = enumerator.surveys.length;
                
                return (
                  <div key={enumerator.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <User className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{enumerator.user.name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <div className="flex items-center space-x-1">
                              <Mail className="w-4 h-4" />
                              <span>{enumerator.user.email}</span>
                            </div>
                            {enumerator.user.phoneNumber && (
                              <div className="flex items-center space-x-1">
                                <Phone className="w-4 h-4" />
                                <span>{enumerator.user.phoneNumber}</span>
                              </div>
                            )}
                            {enumerator.user.jurisdiction && (
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-4 h-4" />
                                <span>{enumerator.user.jurisdiction}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            Employee ID: {enumerator.user.employeeId || 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{enumerator.overallProgress}%</p>
                          <p className="text-sm text-gray-500">Progress</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{completedSurveys}/{totalSurveys}</p>
                          <p className="text-sm text-gray-500">Completed</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">{enumerator.totalCertificates}</p>
                          <p className="text-sm text-gray-500">Certificates</p>
                        </div>
                        <div className="text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            overallStatus === 'excellent' ? 'bg-green-100 text-green-800' :
                            overallStatus === 'good' ? 'bg-blue-100 text-blue-800' :
                            overallStatus === 'needs_attention' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {overallStatus === 'excellent' ? 'Excellent' :
                             overallStatus === 'good' ? 'Good' :
                             overallStatus === 'needs_attention' ? 'Needs Attention' :
                             'Poor'}
                          </span>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openDetailModal(enumerator)}
                          className="flex items-center space-x-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Details</span>
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                        <span className="text-sm text-gray-500">{enumerator.overallProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${enumerator.overallProgress}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex flex-wrap gap-2">
                      {enumerator.surveys.slice(0, 4).map((survey) => (
                        <div key={survey.surveyId} className="flex items-center space-x-2">
                          {getStatusIcon(survey.status)}
                          <span className="text-sm text-gray-600">{survey.surveyTitle}</span>
                        </div>
                      ))}
                      {enumerator.surveys.length > 4 && (
                        <span className="text-sm text-gray-500">+{enumerator.surveys.length - 4} more</span>
                      )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                      <span>Last Activity: {formatDateTime(enumerator.lastActivity)}</span>
                      <div className="flex items-center space-x-4">
                        <span>Surveys: {enumerator.surveys.length}</span>
                        <span>Avg Score: {enumerator.surveys.length > 0 
                          ? (enumerator.surveys.reduce((sum, s) => sum + (s.bestScore || 0), 0) / enumerator.surveys.length).toFixed(1) + '%'
                          : 'N/A'
                        }</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Enumerator Detail Modal */}
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Enumerator Details: ${selectedEnumerator?.user.name}`}
          size="xl"
        >
          {selectedEnumerator && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Personal Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedEnumerator.user.name}</p>
                    <p><span className="font-medium">Email:</span> {selectedEnumerator.user.email}</p>
                    <p><span className="font-medium">Phone:</span> {selectedEnumerator.user.phoneNumber || 'N/A'}</p>
                    <p><span className="font-medium">Employee ID:</span> {selectedEnumerator.user.employeeId || 'N/A'}</p>
                    <p><span className="font-medium">Role:</span> {selectedEnumerator.user.role.name}</p>
                    <p><span className="font-medium">Jurisdiction:</span> {selectedEnumerator.user.jurisdiction || 'N/A'}</p>
                    <p><span className="font-medium">Last Activity:</span> {formatDateTime(selectedEnumerator.lastActivity)}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Performance Summary</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-xl font-bold text-blue-600">{selectedEnumerator.overallProgress}%</p>
                      <p className="text-xs text-gray-600">Overall Progress</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-xl font-bold text-purple-600">{selectedEnumerator.totalCertificates}</p>
                      <p className="text-xs text-gray-600">Certificates</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-xl font-bold text-green-600">
                        {selectedEnumerator.surveys.filter(s => s.status === 'completed').length}
                      </p>
                      <p className="text-xs text-gray-600">Completed</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <p className="text-xl font-bold text-yellow-600">
                        {selectedEnumerator.surveys.length > 0 
                          ? (selectedEnumerator.surveys.reduce((sum, s) => sum + (s.bestScore || 0), 0) / selectedEnumerator.surveys.length).toFixed(1) + '%'
                          : 'N/A'
                        }
                      </p>
                      <p className="text-xs text-gray-600">Avg Score</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Survey Status</h4>
                <div className="space-y-3">
                  {selectedEnumerator.surveys.map((survey) => (
                    <div key={survey.surveyId} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(survey.status)}
                          <h5 className="font-medium text-gray-900">{survey.surveyTitle}</h5>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(survey.status)}`}>
                          {survey.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Attempts</p>
                          <p className="font-medium">{survey.attempts}/{survey.maxAttempts}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Best Score</p>
                          <p className="font-medium">{survey.bestScore ? `${survey.bestScore}%` : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Target Date</p>
                          <p className="font-medium">{formatDate(survey.targetDate)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Last Attempt</p>
                          <p className="font-medium">{survey.lastAttempt ? formatDate(survey.lastAttempt) : 'Never'}</p>
                        </div>
                      </div>
                      
                      {survey.certificateId && (
                        <div className="mt-3 flex items-center space-x-2 text-green-600">
                          <Award className="w-4 h-4" />
                          <span className="text-sm font-medium">Certificate Earned</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="secondary"
                  onClick={() => setIsDetailModalOpen(false)}
                >
                  Close
                </Button>
                <Button className="flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Export Individual Report</span>
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
}