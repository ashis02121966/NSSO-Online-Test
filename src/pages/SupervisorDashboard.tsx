import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout/Layout';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { Modal } from '../components/UI/Modal';
import { supervisorDashboardApi } from '../services/api';
import { SupervisorDashboard as SupervisorDashboardType, TeamPerformance, EnumeratorStatus, UpcomingDeadline } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, Target, Award, Calendar, Clock, AlertTriangle, CheckCircle, TrendingUp, Filter, Download, Eye, User, FileText } from 'lucide-react';
import { formatDateTime, formatDate } from '../utils';

export function SupervisorDashboard() {
  const [dashboardData, setDashboardData] = useState<SupervisorDashboardType | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<TeamPerformance | null>(null);
  const [selectedEnumerator, setSelectedEnumerator] = useState<EnumeratorStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isEnumeratorModalOpen, setIsEnumeratorModalOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('30');

  useEffect(() => {
    fetchDashboardData();
  }, [dateFilter]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await supervisorDashboardApi.getDashboardData(dateFilter);
      if (response.success && response.data) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch supervisor dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openTeamModal = (team: TeamPerformance) => {
    setSelectedTeam(team);
    setIsTeamModalOpen(true);
  };

  const openEnumeratorModal = (enumerator: EnumeratorStatus) => {
    setSelectedEnumerator(enumerator);
    setIsEnumeratorModalOpen(true);
  };

  const getStatusColor = (status: string) => {
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
            <h1 className="text-3xl font-bold text-gray-900">Supervisor Dashboard</h1>
            <p className="text-gray-600 mt-2">Monitor your team's performance and progress</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 3 months</option>
              <option value="365">Last year</option>
            </select>
            <Button className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Enumerators</p>
                <p className="text-3xl font-bold text-blue-600">{dashboardData.totalEnumerators}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Attempts</p>
                <p className="text-3xl font-bold text-green-600">{dashboardData.totalAttempts}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Team Pass Rate</p>
                <p className="text-3xl font-bold text-yellow-600">{dashboardData.passRate.toFixed(1)}%</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100">
                <Target className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Score</p>
                <p className="text-3xl font-bold text-purple-600">{dashboardData.averageScore.toFixed(1)}%</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Upcoming Deadlines Alert */}
        {dashboardData.upcomingDeadlines.length > 0 && (
          <Card className="mb-8 border-l-4 border-orange-500 bg-orange-50">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              <h3 className="text-lg font-semibold text-orange-900">Upcoming Deadlines</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.upcomingDeadlines.map((deadline) => (
                <div key={deadline.surveyId} className="bg-white rounded-lg p-4 border border-orange-200">
                  <h4 className="font-medium text-gray-900 mb-2">{deadline.surveyTitle}</h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-600">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Due: {formatDate(deadline.targetDate)}
                    </p>
                    <p className="text-orange-600 font-medium">
                      {deadline.daysLeft} days left
                    </p>
                    <p className="text-gray-600">
                      {deadline.pendingEnumerators}/{deadline.totalEnumerators} pending
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Team Performance and Enumerator Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Performance</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData.teamPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="teamName" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [
                    name === 'passRate' ? `${value}%` : value,
                    name === 'passRate' ? 'Pass Rate' : 'Average Score'
                  ]} />
                  <Bar dataKey="passRate" fill="#3B82F6" name="passRate" />
                  <Bar dataKey="averageScore" fill="#10B981" name="averageScore" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enumerator Status Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Completed', value: dashboardData.enumeratorStatus.filter(e => e.overallProgress === 100).length },
                      { name: 'In Progress', value: dashboardData.enumeratorStatus.filter(e => e.overallProgress > 0 && e.overallProgress < 100).length },
                      { name: 'Not Started', value: dashboardData.enumeratorStatus.filter(e => e.overallProgress === 0).length }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[0, 1, 2].map((index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Team Performance Cards */}
        <Card className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Team Details</h3>
            <Button variant="secondary" className="flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>Filter Teams</span>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardData.teamPerformance.map((team) => (
              <Card key={team.teamId} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => openTeamModal(team)}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">{team.teamName}</h4>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    team.passRate >= 80 ? 'bg-green-100 text-green-800' :
                    team.passRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {team.passRate.toFixed(1)}% Pass Rate
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-xl font-bold text-blue-600">{team.totalMembers}</p>
                    <p className="text-xs text-gray-600">Members</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-xl font-bold text-green-600">{team.completedTests}</p>
                    <p className="text-xs text-gray-600">Completed</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Average Score</span>
                    <span className="text-sm text-gray-500">{team.averageScore.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${team.averageScore}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Team ID: {team.teamId}</span>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>View Details</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* Enumerator Status List */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Enumerator Status</h3>
            <div className="flex items-center space-x-3">
              <Input
                placeholder="Search enumerators..."
                className="w-64"
              />
              <Button variant="secondary" className="flex items-center space-x-2">
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </Button>
            </div>
          </div>
          
          <div className="space-y-4">
            {dashboardData.enumeratorStatus.map((enumerator) => (
              <div key={enumerator.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{enumerator.user.name}</h4>
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
                      <p className="text-2xl font-bold text-green-600">{enumerator.surveys.filter(s => s.status === 'completed').length}</p>
                      <p className="text-sm text-gray-500">Completed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{enumerator.totalCertificates}</p>
                      <p className="text-sm text-gray-500">Certificates</p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEnumeratorModal(enumerator)}
                      className="flex items-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
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
                    <span
                      key={survey.surveyId}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(survey.status)}`}
                    >
                      {survey.surveyTitle}: {survey.status.replace('_', ' ')}
                    </span>
                  ))}
                  {enumerator.surveys.length > 3 && (
                    <span className="text-sm text-gray-500">+{enumerator.surveys.length - 3} more</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Team Detail Modal */}
        <Modal
          isOpen={isTeamModalOpen}
          onClose={() => setIsTeamModalOpen(false)}
          title={`Team Details: ${selectedTeam?.teamName}`}
          size="xl"
        >
          {selectedTeam && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{selectedTeam.totalMembers}</p>
                  <p className="text-sm text-gray-600">Total Members</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{selectedTeam.completedTests}</p>
                  <p className="text-sm text-gray-600">Completed Tests</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{selectedTeam.passRate.toFixed(1)}%</p>
                  <p className="text-sm text-gray-600">Pass Rate</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{selectedTeam.averageScore.toFixed(1)}%</p>
                  <p className="text-sm text-gray-600">Average Score</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Team Members</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedTeam.members.map((member) => (
                    <div key={member.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{member.user.name}</p>
                          <p className="text-sm text-gray-500">{member.user.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{member.overallProgress}% Complete</p>
                          <p className="text-xs text-gray-500">{member.totalCertificates} certificates</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Enumerator Detail Modal */}
        <Modal
          isOpen={isEnumeratorModalOpen}
          onClose={() => setIsEnumeratorModalOpen(false)}
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
                        <h5 className="font-medium text-gray-900">{survey.surveyTitle}</h5>
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