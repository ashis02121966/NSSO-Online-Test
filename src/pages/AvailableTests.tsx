import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout/Layout';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { Modal } from '../components/UI/Modal';
import { enumeratorDashboardApi, testApi } from '../services/api';
import { AvailableTest, TestSession } from '../types';
import { Play, Calendar, Clock, Target, FileText, Search, Filter, AlertTriangle, CheckCircle, Eye, BookOpen } from 'lucide-react';
import { formatDate, formatDuration } from '../utils';
import { useNavigate } from 'react-router-dom';

export function AvailableTests() {
  const navigate = useNavigate();
  const [availableTests, setAvailableTests] = useState<AvailableTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<AvailableTest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isTestStarting, setIsTestStarting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchAvailableTests();
  }, []);

  const fetchAvailableTests = async () => {
    try {
      setIsLoading(true);
      const response = await enumeratorDashboardApi.getDashboardData();
      if (response.success && response.data) {
        setAvailableTests(response.data.availableTests);
      }
    } catch (error) {
      console.error('Failed to fetch available tests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTest = async (surveyId: string) => {
    try {
      setIsTestStarting(true);
      
      // First check if user is eligible for this test
      const selectedTest = availableTests.find(test => test.surveyId === surveyId);
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

  const filteredTests = availableTests.filter(test => {
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
  });

  const urgentTests = availableTests.filter(test => {
    const daysLeft = Math.ceil((new Date(test.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 3 && daysLeft > 0;
  });

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Available Tests</h1>
            <p className="text-gray-600 mt-2">View and start your assigned tests</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="secondary" className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4" />
              <span>Study Materials</span>
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tests</p>
                <p className="text-3xl font-bold text-blue-600">{availableTests.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-3xl font-bold text-green-600">
                  {availableTests.filter(t => t.isEligible && t.attemptsLeft > 0).length}
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
                <p className="text-sm font-medium text-gray-600">Urgent</p>
                <p className="text-3xl font-bold text-orange-600">{urgentTests.length}</p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-3xl font-bold text-red-600">
                  {availableTests.filter(t => {
                    const daysLeft = Math.ceil((new Date(t.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    return daysLeft <= 0;
                  }).length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-red-100">
                <Clock className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Urgent Tests Alert */}
        {urgentTests.length > 0 && (
          <Card className="mb-8 border-l-4 border-orange-500 bg-orange-50">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              <h3 className="text-lg font-semibold text-orange-900">Urgent: Tests Due Soon</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {urgentTests.map((test) => (
                <div key={test.surveyId} className="bg-white rounded-lg p-4 border border-orange-200">
                  <h4 className="font-medium text-gray-900 mb-2">{test.title}</h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-600">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Due: {formatDate(test.targetDate)}
                    </p>
                    <p className="font-medium text-orange-600">
                      {Math.ceil((new Date(test.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                    </p>
                  </div>
                  <Button
                    onClick={() => handleStartTest(test.surveyId)}
                    disabled={!test.isEligible || test.attemptsLeft === 0}
                    size="sm"
                    className="w-full mt-3"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Test
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-6">
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
        </Card>

        {/* Tests List */}
        <Card>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading tests...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTests.map((test) => (
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