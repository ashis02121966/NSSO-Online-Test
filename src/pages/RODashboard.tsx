import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout/Layout';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { Modal } from '../components/UI/Modal';
import { roDashboardApi } from '../services/api';
import { RODashboard as RODashboardType, DistrictPerformance, SupervisorPerformance } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, Building, Target, TrendingUp, TrendingDown, MapPin, Award, Calendar, Filter, Download, Eye, UserCheck } from 'lucide-react';
import { formatDateTime } from '../utils';

export function RODashboard() {
  const [dashboardData, setDashboardData] = useState<RODashboardType | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictPerformance | null>(null);
  const [selectedSupervisor, setSelectedSupervisor] = useState<SupervisorPerformance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDistrictModalOpen, setIsDistrictModalOpen] = useState(false);
  const [isSupervisorModalOpen, setIsSupervisorModalOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('30');

  useEffect(() => {
    fetchDashboardData();
  }, [dateFilter]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await roDashboardApi.getDashboardData(dateFilter);
      if (response.success && response.data) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch RO dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openDistrictModal = (district: DistrictPerformance) => {
    setSelectedDistrict(district);
    setIsDistrictModalOpen(true);
  };

  const openSupervisorModal = (supervisor: SupervisorPerformance) => {
    setSelectedSupervisor(supervisor);
    setIsSupervisorModalOpen(true);
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
            <h1 className="text-3xl font-bold text-gray-900">Regional Office Dashboard</h1>
            <p className="text-gray-600 mt-2">Comprehensive overview of districts and supervisor performance</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Districts</p>
                <p className="text-3xl font-bold text-blue-600">{dashboardData.totalDistricts}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Supervisors</p>
                <p className="text-3xl font-bold text-green-600">{dashboardData.totalSupervisors}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Enumerators</p>
                <p className="text-3xl font-bold text-purple-600">{dashboardData.totalUsers}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall Pass Rate</p>
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
                <p className="text-3xl font-bold text-red-600">{dashboardData.averageScore.toFixed(1)}%</p>
              </div>
              <div className="p-3 rounded-full bg-red-100">
                <Award className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* District Performance and Enumerator Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">District Performance Comparison</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData.districtPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="districtName" />
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enumerator Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboardData.enumeratorDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percentage }) => `${category}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {dashboardData.enumeratorDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* District Performance Cards */}
        <Card className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">District Performance Details</h3>
            <Button variant="secondary" className="flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>Filter Districts</span>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardData.districtPerformance.map((district) => (
              <Card key={district.districtId} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => openDistrictModal(district)}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">{district.districtName}</h4>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    district.passRate >= 80 ? 'bg-green-100 text-green-800' :
                    district.passRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {district.passRate.toFixed(1)}% Pass Rate
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-xl font-bold text-blue-600">{district.totalEnumerators}</p>
                    <p className="text-xs text-gray-600">Enumerators</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-xl font-bold text-green-600">{district.completedTests}</p>
                    <p className="text-xs text-gray-600">Completed</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Average Score</span>
                    <span className="text-sm text-gray-500">{district.averageScore.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${district.averageScore}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>District ID: {district.districtId}</span>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>View Details</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* Supervisor Performance */}
        <Card className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Supervisor Performance</h3>
            <Button variant="secondary" className="flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>Filter Supervisors</span>
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Supervisor</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Enumerators</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Completed Tests</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Pass Rate</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Avg Score</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.supervisorPerformance.map((supervisor) => (
                  <tr key={supervisor.supervisorId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{supervisor.supervisorName}</p>
                        <p className="text-sm text-gray-500">ID: {supervisor.supervisorId}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-900">{supervisor.totalEnumerators}</td>
                    <td className="py-3 px-4 text-gray-900">{supervisor.completedTests}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        supervisor.passRate >= 80 ? 'bg-green-100 text-green-800' :
                        supervisor.passRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {supervisor.passRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-900">{supervisor.averageScore.toFixed(1)}%</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => openSupervisorModal(supervisor)}
                        className="p-1 text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Performance Trends */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardData.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="attempts" stroke="#3B82F6" name="Attempts" />
                <Line type="monotone" dataKey="passed" stroke="#10B981" name="Passed" />
                <Line type="monotone" dataKey="passRate" stroke="#F59E0B" name="Pass Rate %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* District Detail Modal */}
        <Modal
          isOpen={isDistrictModalOpen}
          onClose={() => setIsDistrictModalOpen(false)}
          title={`District Details: ${selectedDistrict?.districtName}`}
          size="lg"
        >
          {selectedDistrict && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{selectedDistrict.totalEnumerators}</p>
                  <p className="text-sm text-gray-600">Total Enumerators</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{selectedDistrict.completedTests}</p>
                  <p className="text-sm text-gray-600">Completed Tests</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{selectedDistrict.passRate.toFixed(1)}%</p>
                  <p className="text-sm text-gray-600">Pass Rate</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{selectedDistrict.averageScore.toFixed(1)}%</p>
                  <p className="text-sm text-gray-600">Average Score</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-4">District Information</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">District ID</p>
                      <p className="font-medium">{selectedDistrict.districtId}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">District Name</p>
                      <p className="font-medium">{selectedDistrict.districtName}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Supervisor Detail Modal */}
        <Modal
          isOpen={isSupervisorModalOpen}
          onClose={() => setIsSupervisorModalOpen(false)}
          title={`Supervisor Details: ${selectedSupervisor?.supervisorName}`}
          size="xl"
        >
          {selectedSupervisor && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{selectedSupervisor.totalEnumerators}</p>
                  <p className="text-sm text-gray-600">Team Size</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{selectedSupervisor.completedTests}</p>
                  <p className="text-sm text-gray-600">Completed Tests</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{selectedSupervisor.passRate.toFixed(1)}%</p>
                  <p className="text-sm text-gray-600">Team Pass Rate</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{selectedSupervisor.averageScore.toFixed(1)}%</p>
                  <p className="text-sm text-gray-600">Team Avg Score</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Team Members</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedSupervisor.enumerators.map((enumerator) => (
                    <div key={enumerator.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{enumerator.user.name}</p>
                          <p className="text-sm text-gray-500">{enumerator.user.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{enumerator.overallProgress}% Complete</p>
                          <p className="text-xs text-gray-500">{enumerator.totalCertificates} certificates</p>
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