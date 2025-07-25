import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout/Layout';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { Modal } from '../components/UI/Modal';
import { enumeratorDashboardApi } from '../services/api';
import { CompletedTest } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Award, Calendar, Target, CheckCircle, XCircle, Eye, Download, Search, Filter, Trophy, BarChart3 } from 'lucide-react';
import { formatDate, getScoreColor } from '../utils';

export function MyResults() {
  const [completedTests, setCompletedTests] = useState<CompletedTest[]>([]);
  const [selectedResult, setSelectedResult] = useState<CompletedTest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showCertificateAlert, setShowCertificateAlert] = useState(false);

  useEffect(() => {
    fetchResults();
    
    // Check for success message from navigation state
    const state = (window.history.state?.usr || window.history.state) as any;
    if (state?.message) {
      setSuccessMessage(state.message);
      setShowSuccessMessage(true);
      
      if (state.showCertificate) {
        setShowCertificateAlert(true);
      }
      
      // Clear the state to prevent showing the message again
      window.history.replaceState({}, document.title);
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
        setShowCertificateAlert(false);
      }, 5000);
    }
  }, []);

  const fetchResults = async () => {
    try {
      setIsLoading(true);
      const response = await enumeratorDashboardApi.getDashboardData();
      if (response.success && response.data) {
        setCompletedTests(response.data.completedTests);
      }
    } catch (error) {
      console.error('Failed to fetch results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openDetailModal = (result: CompletedTest) => {
    setSelectedResult(result);
    setIsDetailModalOpen(true);
  };

  const filteredResults = completedTests.filter(test => {
    const matchesSearch = test.surveyTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'passed') return matchesSearch && test.isPassed;
    if (filterStatus === 'failed') return matchesSearch && !test.isPassed;
    
    return matchesSearch;
  });

  const passedTests = completedTests.filter(t => t.isPassed).length;
  const failedTests = completedTests.filter(t => !t.isPassed).length;
  const averageScore = completedTests.length > 0 
    ? completedTests.reduce((sum, t) => sum + t.score, 0) / completedTests.length 
    : 0;
  const certificatesEarned = completedTests.filter(t => t.certificateId).length;

  const performanceData = completedTests.map((test, index) => ({
    attempt: index + 1,
    score: test.score,
    name: test.surveyTitle.substring(0, 15) + '...',
    isPassed: test.isPassed
  }));

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Results</h1>
            <p className="text-gray-600 mt-2">View your test performance and progress</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="secondary" className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export Results</span>
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tests</p>
                <p className="text-3xl font-bold text-blue-600">{completedTests.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Passed</p>
                <p className="text-3xl font-bold text-green-600">{passedTests}</p>
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
                <p className="text-3xl font-bold text-yellow-600">{averageScore.toFixed(1)}%</p>
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
                <p className="text-3xl font-bold text-purple-600">{certificatesEarned}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <Trophy className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mb-6">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>{successMessage}</span>
            </div>
          </div>
        )}

        {/* Certificate Alert */}
        {showCertificateAlert && (
          <div className="mb-6">
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5" />
                <span>Congratulations! You've earned a certificate for passing this test.</span>
              </div>
              <Button 
                size="sm" 
                onClick={() => window.location.href = '/my-certificates'}
                className="flex items-center space-x-2"
              >
                <Award className="w-4 h-4" />
                <span>View Certificate</span>
              </Button>
            </div>
          </div>
        )}

        {/* Performance Chart */}
        {completedTests.length > 0 && (
          <Card className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="attempt" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value, name) => [`${value}%`, 'Score']} />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
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
                  placeholder="Search results..."
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
                <option value="all">All Results</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Results List */}
        <Card>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading results...</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No test results found</p>
              <p className="text-sm text-gray-400 mt-1">Complete some tests to see your results here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredResults.map((test) => (
                <div key={test.resultId} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{test.surveyTitle}</h4>
                        {test.isPassed ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                        {test.certificateId && (
                          <Award className="w-5 h-5 text-yellow-600" />
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Score:</span>
                          <span className={`ml-2 font-bold ${getScoreColor(test.score)}`}>
                            {test.score}%
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Status:</span>
                          <span className={`ml-2 font-medium ${test.isPassed ? 'text-green-600' : 'text-red-600'}`}>
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
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${getScoreColor(test.score)}`}>
                          {test.score}%
                        </div>
                        <p className="text-xs text-gray-500">Score</p>
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        <Button
                          onClick={() => openDetailModal(test)}
                          variant="secondary"
                          size="sm"
                          className="flex items-center space-x-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Details</span>
                        </Button>
                        {test.certificateId && (
                          <Button
                            size="sm"
                            className="flex items-center space-x-2"
                          >
                            <Award className="w-4 h-4" />
                            <span>Certificate</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Result Detail Modal */}
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Test Result Details"
          size="lg"
        >
          {selectedResult && (
            <div className="space-y-6">
              <div className="text-center">
                <div className={`text-6xl font-bold ${getScoreColor(selectedResult.score)} mb-2`}>
                  {selectedResult.score}%
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">{selectedResult.surveyTitle}</h3>
                <div className="flex items-center justify-center space-x-2">
                  {selectedResult.isPassed ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-green-600 font-medium">Passed</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span className="text-red-600 font-medium">Failed</span>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Test Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Attempt Number:</span> {selectedResult.attemptNumber}</p>
                    <p><span className="font-medium">Completed:</span> {formatDate(selectedResult.completedAt)}</p>
                    <p><span className="font-medium">Score:</span> 
                      <span className={`ml-2 font-bold ${getScoreColor(selectedResult.score)}`}>
                        {selectedResult.score}%
                      </span>
                    </p>
                    <p><span className="font-medium">Status:</span> 
                      <span className={`ml-2 font-medium ${selectedResult.isPassed ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedResult.isPassed ? 'Passed' : 'Failed'}
                      </span>
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Achievement</h4>
                  <div className="space-y-2 text-sm">
                    {selectedResult.certificateId ? (
                      <div className="flex items-center space-x-2 text-green-600">
                        <Award className="w-5 h-5" />
                        <span className="font-medium">Certificate Earned</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-gray-500">
                        <Award className="w-5 h-5" />
                        <span>No certificate earned</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="secondary"
                  onClick={() => setIsDetailModalOpen(false)}
                >
                  Close
                </Button>
                {selectedResult.certificateId && (
                  <Button className="flex items-center space-x-2">
                    <Award className="w-4 h-4" />
                    <span>View Certificate</span>
                  </Button>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
}