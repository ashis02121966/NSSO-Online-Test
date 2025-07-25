import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout/Layout';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { enumeratorDashboardApi } from '../services/api';
import { UpcomingTest } from '../types';
import { Calendar, Clock, AlertTriangle, CheckCircle, Timer, Play, Eye } from 'lucide-react';
import { formatDate } from '../utils';

export function TestSchedule() {
  const [upcomingTests, setUpcomingTests] = useState<UpcomingTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTestSchedule();
  }, []);

  const fetchTestSchedule = async () => {
    try {
      setIsLoading(true);
      const response = await enumeratorDashboardApi.getDashboardData();
      if (response.success && response.data) {
        setUpcomingTests(response.data.upcomingTests);
      }
    } catch (error) {
      console.error('Failed to fetch test schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (test: UpcomingTest) => {
    if (test.isOverdue) return 'bg-red-100 text-red-800';
    if (test.daysLeft <= 3) return 'bg-orange-100 text-orange-800';
    if (test.daysLeft <= 7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusIcon = (test: UpcomingTest) => {
    if (test.isOverdue) return <AlertTriangle className="w-4 h-4" />;
    if (test.daysLeft <= 3) return <Clock className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  const getStatusText = (test: UpcomingTest) => {
    if (test.isOverdue) return 'Overdue';
    if (test.daysLeft === 0) return 'Due Today';
    if (test.daysLeft === 1) return 'Due Tomorrow';
    return `${test.daysLeft} days left`;
  };

  const urgentTests = upcomingTests.filter(t => t.daysLeft <= 3 || t.isOverdue);
  const upcomingThisWeek = upcomingTests.filter(t => t.daysLeft <= 7 && t.daysLeft > 3);
  const laterTests = upcomingTests.filter(t => t.daysLeft > 7);

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Test Schedule</h1>
            <p className="text-gray-600 mt-2">View your upcoming test deadlines and plan accordingly</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="secondary" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Calendar View</span>
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Upcoming</p>
                <p className="text-3xl font-bold text-blue-600">{upcomingTests.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Timer className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Urgent</p>
                <p className="text-3xl font-bold text-red-600">{urgentTests.length}</p>
              </div>
              <div className="p-3 rounded-full bg-red-100">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-3xl font-bold text-yellow-600">{upcomingThisWeek.length}</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Later</p>
                <p className="text-3xl font-bold text-green-600">{laterTests.length}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>
        </div>

        {isLoading ? (
          <Card>
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading test schedule...</p>
            </div>
          </Card>
        ) : upcomingTests.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Tests</h3>
              <p className="text-gray-500">You have no scheduled tests at the moment</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Urgent Tests */}
            {urgentTests.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-red-900 mb-4 flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Urgent - Immediate Action Required</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {urgentTests.map((test) => (
                    <Card key={test.surveyId} className="border-l-4 border-red-500 bg-red-50">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">{test.title}</h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(test)}`}>
                          {getStatusIcon(test)}
                          <span className="ml-1">{getStatusText(test)}</span>
                        </span>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <p className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>Due: {formatDate(test.targetDate)}</span>
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" className="flex-1">
                          <Play className="w-4 h-4 mr-1" />
                          Start Now
                        </Button>
                        <Button variant="secondary" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* This Week */}
            {upcomingThisWeek.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-yellow-900 mb-4 flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>This Week</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingThisWeek.map((test) => (
                    <Card key={test.surveyId} className="border-l-4 border-yellow-500">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">{test.title}</h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(test)}`}>
                          {getStatusIcon(test)}
                          <span className="ml-1">{getStatusText(test)}</span>
                        </span>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <p className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>Due: {formatDate(test.targetDate)}</span>
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="secondary" size="sm" className="flex-1">
                          <Play className="w-4 h-4 mr-1" />
                          Start Test
                        </Button>
                        <Button variant="secondary" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Later Tests */}
            {laterTests.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-green-900 mb-4 flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>Coming Up</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {laterTests.map((test) => (
                    <Card key={test.surveyId} className="border-l-4 border-green-500">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">{test.title}</h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(test)}`}>
                          {getStatusIcon(test)}
                          <span className="ml-1">{getStatusText(test)}</span>
                        </span>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <p className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>Due: {formatDate(test.targetDate)}</span>
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="secondary" size="sm" className="flex-1">
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}