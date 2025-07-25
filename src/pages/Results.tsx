import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout/Layout';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { Modal } from '../components/UI/Modal';
import { resultApi } from '../services/api';
import { TestResult, AnalyticsData, AnalyticsFilter } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Search, Filter, Download, Eye, Award, TrendingUp, TrendingDown, Users, Target, Clock, Calendar } from 'lucide-react';
import { formatDateTime, formatDuration, getScoreColor } from '../utils';

export function Results() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<AnalyticsFilter>({
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      end: new Date()
    }
  });

  useEffect(() => {
    fetchResults();
    fetchAnalytics();
  }, [filters]);

  const fetchResults = async () => {
    try {
      setIsLoading(true);
      const response = await resultApi.getResults(filters);
      setResults(response.data);
    } catch (error) {
      console.error('Failed to fetch results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await resultApi.getAnalytics(filters);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const handleExportResults = async () => {
    try {
      const response = await resultApi.exportResults(filters);
      // Handle file download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `results_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export results:', error);
    }
  };

  const openDetailModal = (result: TestResult) => {
    setSelectedResult(result);
    setIsDetailModalOpen(true);
  };

  const filteredResults = results.filter(result =>
    result.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Results & Analytics</h1>
            <p className="text-gray-600 mt-2">Comprehensive test results and performance analytics</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="secondary"
              onClick={() => setIsFilterModalOpen(true)}
              className="flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </Button>
            <Button
              onClick={handleExportResults}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </Button>
          </div>
        </div>

        {/* Analytics Overview */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Attempts</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.overview.totalAttempts}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pass Rate</p>
                  <p className="text-3xl font-bold text-green-600">{analytics.overview.passRate.toFixed(1)}%</p>
                </div>
                <div className="p-3 rounded-full bg-green-100">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Score</p>
                  <p className="text-3xl font-bold text-yellow-600">{analytics.overview.averageScore.toFixed(1)}%</p>
                </div>
                <div className="p-3 rounded-full bg-yellow-100">
                  <Award className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Time</p>
                  <p className="text-3xl font-bold text-purple-600">{formatDuration(analytics.overview.averageTime)}</p>
                </div>
                <div className="p-3 rounded-full bg-purple-100">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Charts */}
        {analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Role</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.performanceByRole}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}%`, 'Pass Rate']} />
                    <Bar dataKey="percentage" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Survey</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.performanceBySurvey}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="percentage"
                    >
                      {analytics.performanceBySurvey.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        )}

        {/* Time Series Chart */}
        {analytics && analytics.timeSeriesData.length > 0 && (
          <Card className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="attempts" stroke="#3B82F6" name="Attempts" />
                  <Line type="monotone" dataKey="passed" stroke="#10B981" name="Passed" />
                  <Line type="monotone" dataKey="averageScore" stroke="#F59E0B" name="Avg Score" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Top and Low Performers */}
        {analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Top Performers</h3>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div className="space-y-3">
                {analytics.topPerformers.map((performer, index) => (
                  <div key={performer.userId} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{performer.userName}</p>
                        <p className="text-sm text-gray-500">{performer.totalAttempts} attempts</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{performer.averageScore.toFixed(1)}%</p>
                      <p className="text-sm text-gray-500">{performer.passRate.toFixed(1)}% pass rate</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Needs Improvement</h3>
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div className="space-y-3">
                {analytics.lowPerformers.map((performer, index) => (
                  <div key={performer.userId} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{performer.userName}</p>
                        <p className="text-sm text-gray-500">{performer.totalAttempts} attempts</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">{performer.averageScore.toFixed(1)}%</p>
                      <p className="text-sm text-gray-500">{performer.passRate.toFixed(1)}% pass rate</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Results Table */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Test Results</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search results..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading results...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">User</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Survey</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Score</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Attempt</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Time Spent</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Completed</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((result) => (
                    <tr key={result.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{result.user.name}</p>
                          <p className="text-sm text-gray-500">{result.user.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{result.survey.title}</p>
                        <p className="text-sm text-gray-500">{result.user.role.name}</p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className={`text-lg font-bold ${getScoreColor(result.score)}`}>
                            {result.score}%
                          </span>
                          <span className="text-sm text-gray-500">
                            ({result.correctAnswers}/{result.totalQuestions})
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          result.isPassed 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {result.isPassed ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-900">
                        {result.attemptNumber}/{result.survey.maxAttempts}
                      </td>
                      <td className="py-3 px-4 text-gray-900">
                        {formatDuration(Math.floor(result.timeSpent / 60))}
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-sm">
                        {formatDateTime(result.completedAt)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openDetailModal(result)}
                            className="p-1 text-blue-600 hover:text-blue-700"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {result.certificateId && (
                            <button className="p-1 text-green-600 hover:text-green-700">
                              <Award className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Result Detail Modal */}
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Test Result Details"
          size="xl"
        >
          {selectedResult && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">User Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedResult.user.name}</p>
                    <p><span className="font-medium">Email:</span> {selectedResult.user.email}</p>
                    <p><span className="font-medium">Role:</span> {selectedResult.user.role.name}</p>
                    <p><span className="font-medium">Jurisdiction:</span> {selectedResult.user.jurisdiction || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Test Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Survey:</span> {selectedResult.survey.title}</p>
                    <p><span className="font-medium">Attempt:</span> {selectedResult.attemptNumber}/{selectedResult.survey.maxAttempts}</p>
                    <p><span className="font-medium">Time Spent:</span> {formatDuration(Math.floor(selectedResult.timeSpent / 60))}</p>
                    <p><span className="font-medium">Completed:</span> {formatDateTime(selectedResult.completedAt)}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Overall Performance</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{selectedResult.score}%</p>
                    <p className="text-sm text-gray-600">Overall Score</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{selectedResult.correctAnswers}</p>
                    <p className="text-sm text-gray-600">Correct Answers</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">{selectedResult.totalQuestions - selectedResult.correctAnswers}</p>
                    <p className="text-sm text-gray-600">Incorrect Answers</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{selectedResult.grade || 'N/A'}</p>
                    <p className="text-sm text-gray-600">Grade</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Section-wise Performance</h4>
                <div className="space-y-3">
                  {selectedResult.sectionScores.map((section) => (
                    <div key={section.sectionId} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">{section.sectionTitle}</h5>
                        <span className={`font-bold ${getScoreColor(section.score)}`}>
                          {section.score}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{section.correctAnswers}/{section.totalQuestions} correct</span>
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${section.score}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Filter Modal */}
        <Modal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          title="Filter Results"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={filters.dateRange.start.toISOString().split('T')[0]}
                onChange={(e) => setFilters({
                  ...filters,
                  dateRange: { ...filters.dateRange, start: new Date(e.target.value) }
                })}
              />
              <Input
                label="End Date"
                type="date"
                value={filters.dateRange.end.toISOString().split('T')[0]}
                onChange={(e) => setFilters({
                  ...filters,
                  dateRange: { ...filters.dateRange, end: new Date(e.target.value) }
                })}
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setIsFilterModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => {
                setIsFilterModalOpen(false);
                fetchResults();
                fetchAnalytics();
              }}>
                Apply Filters
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}