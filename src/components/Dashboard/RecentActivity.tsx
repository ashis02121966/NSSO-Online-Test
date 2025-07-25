import React from 'react';
import { Card } from '../UI/Card';
import { Activity } from '../../types';
import { formatDateTime } from '../../utils';
import { Clock, User, FileText, Upload, CheckCircle } from 'lucide-react';

interface RecentActivityProps {
  activities: Activity[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'test_completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'user_created':
        return <User className="w-4 h-4 text-blue-600" />;
      case 'survey_created':
        return <FileText className="w-4 h-4 text-purple-600" />;
      case 'question_uploaded':
        return <Upload className="w-4 h-4 text-orange-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <button className="text-sm text-blue-600 hover:text-blue-700">
          View All
        </button>
      </div>
      
      <div className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-gray-500 text-sm">No recent activity</p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{activity.description}</p>
                <p className="text-xs text-gray-500">
                  by {activity.userName} • {formatDateTime(activity.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}