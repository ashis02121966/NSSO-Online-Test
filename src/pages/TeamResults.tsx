import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout/Layout';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { Modal } from '../components/UI/Modal';
import { supervisorDashboardApi } from '../services/api';
import { TeamPerformance, TestResult, EnumeratorStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, Target, Award, TrendingUp, TrendingDown, Filter, Download, Eye, Calendar, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { formatDateTime, formatDate, getScoreColor } from '../utils';

export function TeamResults() {
  const [teamData, setTeamData] = useState<TeamPerformance[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<TeamPerformance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('30');
  const [performanceFilter, setPerformanceFilter] = useState('all');

  useEffect(() => {
    fetchTeamResults();
  }, [dateFilter]);

  const fetchTeamResults = async () => {
    try {
      setIsLoading(true);
      const response = await supervisorDashboardApi.getDashboardData(dateFilter);
      if (response.success && response.data) {
        setTeamData(response.data.teamPerformance);
      }
    } catch (error) {
      console.error('Failed to fetch team results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openDetailModal = (team: TeamPerformance) => {
    setSelectedTeam(team);
    setIsDetailModalOpen(true);
  };

  const getPerformanceLevel = (passRate: number) => {
    if (passRate >= 90) return 'excellent';
    if (passRate >= 80) return 'good';
    if (passRate >= 60) return 'average';
    return 'poor';
  };

  const getPerformanceColor = (level: string) => {
    switch (level) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      case 'average':
        return 'bg-yellow-100 text-yellow-800';
      case 'poor':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTeams = teamData.filter(team => {
    const matchesSearch = team.teamName.toLowerCase().includes(searchTerm.toLowerCase());
    const performanceLevel = getPerformanceLevel(team.passRate);
    const matchesPerformance = performanceFilter === 'all' || performanceLevel === performanceFilter;
    
    return matchesSearch && matchesPerformance;
  });

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const overallStats = {
    totalTeams: teamData.length,
    totalMembers: teamData.reduce((sum, team) => sum + team.totalMembers, 0),
    averagePassRate: teamData.reduce((sum, team) => sum + team.passRate, 0) / teamData.length || 0,
    averageScore: teamData.reduce((sum, team) => sum + team.averageScore, 0) / teamData.length || 0,
    topPerformingTeam: teamData.reduce((prev, current) => (prev.passRate > current.passRate) ? prev : current, teamData[0]),
    lowPerformingTeam: teamData.reduce((prev, current) => (prev.passRate < current.passRate) ? prev : current, teamData[0])
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team Results</h1>
            <p className="text-gray-600 mt-2">Comprehensive analysis of team performance and progress</p>
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

        {/* Overall Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Teams</p>
                <p className="text-3xl font-bold text-blue-600">{overallStats.totalTeams}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-3xl font-bold text-green-600">{overallStats.totalMembers}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Pass Rate</p>
                <p className="text-3xl font-bold text-yellow-600">{overallStats.averagePassRate.toFixed(1)}%</p>
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
                <p className="text-3xl font-bold text-purple-600">{overallStats.averageScore.toFixed(1)}%</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Performance Comparison</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamData}>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Excellent (90%+)', value: teamData.filter(t => t.passRate >= 90).length },
                      { name: 'Good (80-89%)', value: teamData.filter(t => t.passRate >= 80 && t.passRate < 90).length },
                      { name: 'Average (60-79%)', value: teamData.filter(t => t.passRate >= 60 && t.passRate < 80).length },
                      { name: 'Poor (<60%)', value: teamData.filter(t => t.passRate < 60).length }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[0, 1, 2, 3].map((index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Top and Low Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Top Performing Teams</h3>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="space-y-3">
              {teamData
                .sort((a, b) => b.passRate - a.passRate)
                .slice(0, 3)
                .map((team, index) => (
                  <div key={team.teamId} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{team.teamName}</p>
                        <p className="text-sm text-gray-500">{team.totalMembers} members</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{team.passRate.toFixed(1)}%</p>
                      <p className="text-sm text-gray-500">Pass Rate</p>
                    </div>
                  </div>
                ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Teams Needing Support</h3>
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div className="space-y-3">
              {teamData
                .sort((a, b) => a.passRate - b.passRate)
                .slice(0, 3)
                .map((team, index) => (
                  <div key={team.teamId} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{team.teamName}</p>
                        <p className="text-sm text-gray-500">{team.totalMembers} members</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">{team.passRate.toFixed(1)}%</p>
                      <p className="text-sm text-gray-500">Pass Rate</p>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Input
                  placeholder="Search teams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              <select
                value={performanceFilter}
                onChange={(e) => setPerformanceFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Performance Levels</option>
                <option value="excellent">Excellent (90%+)</option>
                <option value="good">Good (80-89%)</option>
                <option value="average">Average (60-79%)</option>
                <option value="poor">Poor (0-60%)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Team Results Table */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Detailed Team Results</h3>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading team results...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTeams.map((team) => {
                const performanceLevel = getPerformanceLevel(team.passRate);
                
                return (
                  <div key={team.teamId} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{team.teamName}</h4>
                          <p className="text-sm text-gray-500">Team ID: {team.teamId}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{team.totalMembers}</p>
                          <p className="text-sm text-gray-500">Members</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{team.completedTests}</p>
                          <p className="text-sm text-gray-500">Completed</p>
                        </div>
                        <div className="text-center">
                          <p className={`text-2xl font-bold ${getScoreColor(team.passRate)}`}>{team.passRate.toFixed(1)}%</p>
                          <p className="text-sm text-gray-500">Pass Rate</p>
                        </div>
                        <div className="text-center">
                          <p className={`text-2xl font-bold ${getScoreColor(team.averageScore)}`}>{team.averageScore.toFixed(1)}%</p>
                          <p className="text-sm text-gray-500">Avg Score</p>
                        </div>
                        <div className="text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPerformanceColor(performanceLevel)}`}>
                            {performanceLevel.charAt(0).toUpperCase() + performanceLevel.slice(1)}
                          </span>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openDetailModal(team)}
                          className="flex items-center space-x-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Details</span>
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Team Progress</span>
                        <span className="text-sm text-gray-500">{((team.completedTests / team.totalMembers) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(team.completedTests / team.totalMembers) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Team Detail Modal */}
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
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
                <h4 className="font-semibold text-gray-900 mb-4">Team Members Performance</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedTeam.members.map((member) => (
                    <div key={member.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium text-gray-900">{member.user.name}</p>
                          <p className="text-sm text-gray-500">{member.user.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{member.overallProgress}% Complete</p>
                          <p className="text-xs text-gray-500">{member.totalCertificates} certificates</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Surveys</p>
                          <p className="font-medium">{member.surveys.length}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Completed</p>
                          <p className="font-medium">{member.surveys.filter(s => s.status === 'completed').length}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Best Score</p>
                          <p className="font-medium">
                            {member.surveys.length > 0 
                              ? Math.max(...member.surveys.map(s => s.bestScore || 0)).toFixed(1) + '%'
                              : 'N/A'
                            }
                          </p>
                        </div>
                      </div>
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