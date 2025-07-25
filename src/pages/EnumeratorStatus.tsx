import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout/Layout';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { Modal } from '../components/UI/Modal';
import { enumeratorApi } from '../services/api';
import { EnumeratorStatus, EnumeratorSurveyStatus } from '../types';
import { Search, Eye, Award, Clock, AlertTriangle, CheckCircle, XCircle, Calendar, Target, User } from 'lucide-react';
import { formatDateTime, formatDate } from '../utils';

export function EnumeratorStatusPage() {
  const [enumerators, setEnumerators] = useState<EnumeratorStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEnumerator, setSelectedEnumerator] = useState<EnumeratorStatus | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchEnumeratorStatus();
  }, []);

  const fetchEnumeratorStatus = async () => {
    try {
      setIsLoading(true);
      const response = await enumeratorApi.getEnumeratorStatus();
      setEnumerators(response.data);
    } catch (error) {
      console.error('Failed to fetch enumerator status:', error);
    } finally {
      setIsLoading(false);
    }
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

  const openDetailModal = (enumerator: EnumeratorStatus) => {
    setSelectedEnumerator(enumerator);
    setIsDetailModalOpen(true);
  };

  const filteredEnumerators = enumerators.filter(enumerator => {
    const matchesSearch = enumerator.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         enumerator.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    
    const overallStatus = getOverallStatus(enumerator);
    return matchesSearch && overallStatus === statusFilter;
  });

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Enumerator Status</h1>
            <p className="text-gray-600 mt-2">Track examination progress and performance of all enumerators</p>
          </div>
        </div>

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
            </div>
          </div>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Enumerators</p>
                <p className="text-3xl font-bold text-gray-900">{enumerators.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <User className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed All</p>
                <p className="text-3xl font-bold text-green-600">
                  {enumerators.filter(e => getOverallStatus(e) === 'excellent').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Need Attention</p>
                <p className="text-3xl font-bold text-orange-600">
                  {enumerators.filter(e => getOverallStatus(e) === 'needs_attention').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Certificates</p>
                <p className="text-3xl font-bold text-purple-600">
                  {enumerators.reduce((sum, e) => sum + e.totalCertificates, 0)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Enumerator List */}
        <Card>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading enumerator status...</p>
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
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{enumerator.user.name}</h3>
                          <p className="text-sm text-gray-500">{enumerator.user.email}</p>
                          <p className="text-sm text-gray-500">{enumerator.user.jurisdiction || 'No jurisdiction'}</p>
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
                      {enumerator.surveys.slice(0, 3).map((survey) => (
                        <div key={survey.surveyId} className="flex items-center space-x-2">
                          {getStatusIcon(survey.status)}
                          <span className="text-sm text-gray-600">{survey.surveyTitle}</span>
                        </div>
                      ))}
                      {enumerator.surveys.length > 3 && (
                        <span className="text-sm text-gray-500">+{enumerator.surveys.length - 3} more</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Detail Modal */}
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Enumerator Details"
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
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
}