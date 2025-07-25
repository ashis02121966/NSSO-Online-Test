import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout/Layout';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { Modal } from '../components/UI/Modal';
import { zoDashboardApi } from '../services/api';
import { ZODashboard as ZODashboardType, ZonePerformance } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, Building, Target, TrendingUp, TrendingDown, MapPin, Award, Calendar, Filter, Download, Eye } from 'lucide-react';
import { formatDateTime } from '../utils';

export function ZODashboard() {
  const [dashboardData, setDashboardData] = useState<ZODashboardType | null>(null);
  const [selectedZone, setSelectedZone] = useState<ZonePerformance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('30');

  useEffect(() => {
    fetchDashboardData();
  }, [dateFilter]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await zoDashboardApi.getDashboardData(dateFilter);
      if (response.success && response.data) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch ZO dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openZoneModal = (zone: ZonePerformance) => {
    setSelectedZone(zone);
    setIsZoneModalOpen(true);
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
            <h1 className="text-3xl font-bold text-gray-900">Zonal Office Dashboard</h1>
            <p className="text-gray-600 mt-2">Comprehensive overview of all zones and regional performance</p>
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
                <p className="text-sm font-medium text-gray-600">Total Zones</p>
                <p className="text-3xl font-bold text-blue-600">{dashboardData.totalZones}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Regions</p>
                <p className="text-3xl font-bold text-green-600">{dashboardData.totalRegions}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <Building className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
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

        {/* Zone Performance Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Zone Performance Comparison</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData.zonePerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="zoneName" />
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Regional Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboardData.regionalBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ regionName, percentage }) => `${regionName}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="totalEnumerators"
                  >
                    {dashboardData.regionalBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Zone Performance Cards */}
        <Card className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Zone Performance Details</h3>
            <Button variant="secondary" className="flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>Filter Zones</span>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardData.zonePerformance.map((zone) => (
              <Card key={zone.zoneId} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => openZoneModal(zone)}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">{zone.zoneName}</h4>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    zone.passRate >= 80 ? 'bg-green-100 text-green-800' :
                    zone.passRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {zone.passRate.toFixed(1)}% Pass Rate
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-xl font-bold text-blue-600">{zone.totalEnumerators}</p>
                    <p className="text-xs text-gray-600">Enumerators</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-xl font-bold text-green-600">{zone.completedTests}</p>
                    <p className="text-xs text-gray-600">Completed</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Average Score</span>
                    <span className="text-sm text-gray-500">{zone.averageScore.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${zone.averageScore}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{zone.regions.length} Regions</span>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>View Details</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* Top and Low Performing Regions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Top Performing Regions</h3>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="space-y-3">
              {dashboardData.topPerformingRegions.map((region, index) => (
                <div key={region.name} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{region.name}</p>
                      <p className="text-sm text-gray-500">{region.total} enumerators</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{region.percentage.toFixed(1)}%</p>
                    <p className="text-sm text-gray-500">Pass Rate</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Regions Needing Attention</h3>
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div className="space-y-3">
              {dashboardData.lowPerformingRegions.map((region, index) => (
                <div key={region.name} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{region.name}</p>
                      <p className="text-sm text-gray-500">{region.total} enumerators</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">{region.percentage.toFixed(1)}%</p>
                    <p className="text-sm text-gray-500">Pass Rate</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

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

        {/* Zone Detail Modal */}
        <Modal
          isOpen={isZoneModalOpen}
          onClose={() => setIsZoneModalOpen(false)}
          title={`Zone Details: ${selectedZone?.zoneName}`}
          size="xl"
        >
          {selectedZone && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{selectedZone.totalEnumerators}</p>
                  <p className="text-sm text-gray-600">Total Enumerators</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{selectedZone.completedTests}</p>
                  <p className="text-sm text-gray-600">Completed Tests</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{selectedZone.passRate.toFixed(1)}%</p>
                  <p className="text-sm text-gray-600">Pass Rate</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{selectedZone.averageScore.toFixed(1)}%</p>
                  <p className="text-sm text-gray-600">Average Score</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Regional Breakdown</h4>
                <div className="space-y-3">
                  {selectedZone.regions.map((region) => (
                    <div key={region.regionId} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-900">{region.regionName}</h5>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          region.passRate >= 80 ? 'bg-green-100 text-green-800' :
                          region.passRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {region.passRate.toFixed(1)}% Pass Rate
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Enumerators</p>
                          <p className="font-medium">{region.totalEnumerators}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Completed</p>
                          <p className="font-medium">{region.completedTests}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Avg Score</p>
                          <p className="font-medium">{region.averageScore.toFixed(1)}%</p>
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