import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout/Layout';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { Modal } from '../components/UI/Modal';
import { enumeratorDashboardApi, testApi } from '../services/api';
import { EnumeratorDashboard as EnumeratorDashboardType, AvailableTest, CompletedTest, TestSession } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Play, Award, Calendar, Clock, Target, CheckCircle, AlertTriangle, Download, Eye, FileText, TrendingUp, Search, Filter, User, BookOpen, Trophy, Timer } from 'lucide-react';
import { formatDateTime, formatDate, formatDuration, formatTime } from '../utils';
import { useNavigate } from 'react-router-dom';

export function EnumeratorDashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<EnumeratorDashboardType | null>(null);
  const [selectedTest, setSelectedTest] = useState<AvailableTest | null>(null);
  const [currentSession, setCurrentSession] = useState<TestSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isTestStarting, setIsTestStarting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await enumeratorDashboardApi.getDashboardData();
      if (response.success && response.data) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch enumerator dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTest = async (surveyId: string) => {
    try {
      setIsTestStarting(true);
      
      // First check if user is eligible for this test
      const selectedTest = dashboardData?.availableTests.find(test => test.surveyId === surveyId);
      if (!selectedTest || !selectedTest.isEligible || selectedTest.attemptsLeft === 0) {
        alert('You are not eligible to take this test or have no attempts remaining.');
        return;
      }

      // Create test session via API
      const sessionResponse = await testApi.createTestSession(surveyId);
      if (!sessionResponse.success || !sessionResponse.data) {
        throw new Error(sessionResponse.message || 'Failed to create test session');
      }

      const sessionId = sessionResponse.data.id;
      
      // Navigate to test interface with the session ID
      navigate(`/test/${sessionId}`, { 
        state: { 
          surveyId: surveyId,
          startTime: sessionResponse.data.startTime,
          sessionData: sessionResponse.data
        }
      });
    } catch (error) {
      console.error('Failed to start test:', error);
      alert(`Failed to start test: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsTestStarting(false);
      setIsTestModalOpen(false);
    }
  };

  const openTestModal = (test: AvailableTest) => {
    setSelectedTest(test);
    setIsTestModalOpen(true);
  };

  const getTestStatusColor = (test: AvailableTest) => {
    if (!test.isEligible) return 'bg-gray-100 text-gray-800';
    if (test.attemptsLeft === 0) return 'bg-red-100 text-red-800';
    const daysLeft = Math.ceil((new Date(test.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 3) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };

  const getTestStatusText = (test: AvailableTest) => {
    if (!test.isEligible) return 'Not Eligible';
    if (test.attemptsLeft === 0) return 'No Attempts Left';
    const daysLeft = Math.ceil((new Date(test.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 0) return 'Overdue';
    if (daysLeft <= 3) return `${daysLeft} days left`;
    return 'Available';
  };

  const filteredAvailableTests = dashboardData?.availableTests.filter(test => {
    const matchesSearch = test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    
    const daysLeft = Math.ceil((new Date(test.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    switch (filterStatus) {
      case 'urgent':
        return matchesSearch && daysLeft <= 3 && daysLeft > 0;
      case 'available':
        return matchesSearch && test.isEligible && test.attemptsLeft > 0;
      case 'overdue':
        return matchesSearch && daysLeft <= 0;
      default:
        return matchesSearch;
    }
  }) || [];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!dashboardData) {
    return (
      <Layout>
        <div className="p-6">
          <div className="text-center text-gray-500">
            Failed to load dashboard data
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
            <p className="text-gray-600 mt-2">Track your test progress and achievements</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="secondary" className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Download Progress Report</span>
            </Button>
            <Button className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4" />
              <span>Study Materials</span>
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available Tests</p>
                <p className="text-3xl font-bold text-blue-600">{dashboardData.availableTests.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Tests</p>
                <p className="text-3xl font-bold text-green-600">{dashboardData.completedTests.length}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-3xl font-bold text-yellow-600">{dashboardData.averageScore.toFixed(1)}%</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100">
                <Target className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Certificates</p>
                <p className="text-3xl font-bold text-purple-600">{dashboardData.certificates.length}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Progress</h3>
            <div className="text-center mb-6">
              <div className="relative inline-flex items-center justify-center w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-gray-200"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - dashboardData.overallProgress / 100)}`}
                    className="text-blue-600 transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">{dashboardData.overallProgress}%</span>
                </div>
              </div>
              <p className="text-gray-600 mt-2">Overall Completion</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-xl font-bold text-green-600">{dashboardData.passedTests}</p>
                <p className="text-xs text-gray-600">Passed Tests</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-xl font-bold text-blue-600">{dashboardData.totalAttempts}</p>
                <p className="text-xs text-gray-600">Total Attempts</p>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Performance Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboardData.completedTests.map((test, index) => ({
                  attempt: index + 1,
                  score: test.score,
                  name: test.surveyTitle.substring(0, 10) + '...'
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="attempt" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                  <Line type="monotone" dataKey="score" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Urgent Tests Alert */}
        {dashboardData.upcomingTests.filter(t => t.daysLeft <= 7).length > 0 && (
          <Card className="mb-8 border-l-4 border-orange-500 bg-orange-50">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              <h3 className="text-lg font-semibold text-orange-900">Urgent: Tests Due Soon</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.upcomingTests.filter(t => t.daysLeft <= 7).map((test) => (
                <div key={test.surveyId} className="bg-white rounded-lg p-4 border border-orange-200">
                  <h4 className="font-medium text-gray-900 mb-2">{test.title}</h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-600">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Due: {formatDate(test.targetDate)}
                    </p>
                    <p className={`font-medium ${test.isOverdue ? 'text-red-600' : 'text-orange-600'}`}>
                      {test.isOverdue ? 'OVERDUE' : `${test.daysLeft} days left`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Card>
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Eye className="w-4 h-4 inline mr-2" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('available')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'available'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BookOpen className="w-4 h-4 inline mr-2" />
                Available Tests ({dashboardData.availableTests.length})
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'results'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <TrendingUp className="w-4 h-4 inline mr-2" />
                My Results ({dashboardData.completedTests.length})
              </button>
              <button
                onClick={() => setActiveTab('certificates')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'certificates'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Trophy className="w-4 h-4 inline mr-2" />
                My Certificates ({dashboardData.certificates.length})
              </button>
            </nav>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Quick Stats</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Tests Available</span>
                      <span className="text-lg font-bold text-blue-600">{dashboardData.availableTests.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Tests Passed</span>
                      <span className="text-lg font-bold text-green-600">{dashboardData.passedTests}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Average Score</span>
                      <span className="text-lg font-bold text-yellow-600">{dashboardData.averageScore.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Certificates Earned</span>
                      <span className="text-lg font-bold text-purple-600">{dashboardData.certificates.length}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Recent Activity</h4>
                  <div className="space-y-3">
                    {dashboardData.completedTests.slice(0, 3).map((test) => (
                      <div key={test.resultId} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className={`w-3 h-3 rounded-full ${test.isPassed ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{test.surveyTitle}</p>
                          <p className="text-xs text-gray-500">{formatDate(test.completedAt)}</p>
                        </div>
                        <span className={`text-sm font-bold ${test.isPassed ? 'text-green-600' : 'text-red-600'}`}>
                          {test.score}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Available Tests Tab */}
          {activeTab === 'available' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      placeholder="Search tests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Tests</option>
                    <option value="available">Available</option>
                    <option value="urgent">Urgent (Due Soon)</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {filteredAvailableTests.map((test) => (
                  <div key={test.surveyId} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">{test.title}</h4>
                        <p className="text-gray-600 text-sm mb-3">{test.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>Due: {formatDate(test.targetDate)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>Duration: {formatDuration(test.duration)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span>{test.totalQuestions} Questions</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Target className="w-4 h-4 text-gray-400" />
                            <span>Pass: {test.passingScore}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTestStatusColor(test)}`}>
                            {getTestStatusText(test)}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            {test.attemptsLeft}/{test.maxAttempts} attempts left
                          </p>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          <Button
                            onClick={() => openTestModal(test)}
                            variant="secondary"
                            size="sm"
                            className="flex items-center space-x-2"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Details</span>
                          </Button>
                          <Button
                            onClick={() => handleStartTest(test.surveyId)}
                            disabled={!test.isEligible || test.attemptsLeft === 0 || isTestStarting}
                            loading={isTestStarting && selectedTest?.surveyId === test.surveyId}
                            size="sm"
                            className="flex items-center space-x-2"
                          >
                            <Play className="w-4 h-4" />
                            <span>Start Test</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* My Results Tab */}
          {activeTab === 'results' && (
            <div className="space-y-4">
              {dashboardData.completedTests.map((test) => (
                <div key={test.resultId} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">{test.surveyTitle}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Score:</span>
                          <span className={`ml-2 font-bold ${test.score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                            {test.score}%
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Status:</span>
                          <span className={`ml-2 ${test.isPassed ? 'text-green-600' : 'text-red-600'}`}>
                            {test.isPassed ? 'Passed' : 'Failed'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Attempt:</span>
                          <span className="ml-2">{test.attemptNumber}</span>
                        </div>
                        <div>
                          <span className="font-medium">Completed:</span>
                          <span className="ml-2">{formatDate(test.completedAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {test.certificateId && (
                        <div className="flex items-center space-x-2 text-green-600">
                          <Award className="w-5 h-5" />
                          <span className="text-sm font-medium">Certificate Earned</span>
                        </div>
                      )}
                      <Button variant="secondary" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* My Certificates Tab */}
          {activeTab === 'certificates' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardData.certificates.map((certificate) => (
                <Card key={certificate.id} className="hover:shadow-lg transition-shadow">
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Award className="w-8 h-8 text-yellow-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">{certificate.survey.title}</h4>
                    <p className="text-sm text-gray-500">Certificate #{certificate.certificateNumber}</p>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p><span className="font-medium">Issued:</span> {formatDate(certificate.issuedAt)}</p>
                    <p><span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                        certificate.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {certificate.status.charAt(0).toUpperCase() + certificate.status.slice(1)}
                      </span>
                    </p>
                  </div>
                  
                  <Button className="w-full flex items-center justify-center space-x-2">
                    <Download className="w-4 h-4" />
                    <span>Download Certificate</span>
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </Card>

        {/* Test Detail Modal */}
        <Modal
          isOpen={isTestModalOpen}
          onClose={() => setIsTestModalOpen(false)}
          title={`Test Details: ${selectedTest?.title}`}
          size="lg"
        >
          {selectedTest && (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                <p className="text-gray-600">{selectedTest.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Test Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Duration:</span> {formatDuration(selectedTest.duration)}</p>
                    <p><span className="font-medium">Questions:</span> {selectedTest.totalQuestions}</p>
                    <p><span className="font-medium">Passing Score:</span> {selectedTest.passingScore}%</p>
                    <p><span className="font-medium">Target Date:</span> {formatDate(selectedTest.targetDate)}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Attempt Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Attempts Left:</span> {selectedTest.attemptsLeft}/{selectedTest.maxAttempts}</p>
                    <p><span className="font-medium">Eligibility:</span> 
                      <span className={`ml-2 ${selectedTest.isEligible ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedTest.isEligible ? 'Eligible' : 'Not Eligible'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="secondary"
                  onClick={() => setIsTestModalOpen(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    handleStartTest(selectedTest.surveyId);
                  }}
                  disabled={!selectedTest.isEligible || selectedTest.attemptsLeft === 0 || isTestStarting}
                  loading={isTestStarting && selectedTest?.surveyId === selectedTest.surveyId}
                  className="flex items-center space-x-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Test</span>
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
}