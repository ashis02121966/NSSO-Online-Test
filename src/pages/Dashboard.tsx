import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout/Layout';
import { StatsCard } from '../components/Dashboard/StatsCard';
import { RecentActivity } from '../components/Dashboard/RecentActivity';
import { PerformanceChart } from '../components/Dashboard/PerformanceChart';
import { dashboardApi } from '../services/api';
import { Dashboard as DashboardType } from '../types';
import { Users, FileText, Target, Award } from 'lucide-react';

export function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await dashboardApi.getDashboardData();
        if (response.success && response.data) {
          setDashboardData(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Overview of your survey platform performance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Users"
            value={dashboardData.totalUsers}
            icon={<Users className="w-6 h-6" />}
            color="blue"
            change={{ value: 12, type: 'increase' }}
          />
          <StatsCard
            title="Active Surveys"
            value={dashboardData.totalSurveys}
            icon={<FileText className="w-6 h-6" />}
            color="green"
            change={{ value: 8, type: 'increase' }}
          />
          <StatsCard
            title="Test Attempts"
            value={dashboardData.totalAttempts}
            icon={<Target className="w-6 h-6" />}
            color="yellow"
            change={{ value: 15, type: 'increase' }}
          />
          <StatsCard
            title="Pass Rate"
            value={`${dashboardData.passRate.toFixed(1)}%`}
            icon={<Award className="w-6 h-6" />}
            color="red"
            change={{ value: 3, type: 'decrease' }}
          />
        </div>

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <PerformanceChart
            title="Performance by Role"
            data={dashboardData.performanceByRole}
          />
          <RecentActivity activities={dashboardData.recentActivity} />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <PerformanceChart
            title="Performance by Survey"
            data={dashboardData.performanceBySurvey}
          />
        </div>
      </div>
    </Layout>
  );
}