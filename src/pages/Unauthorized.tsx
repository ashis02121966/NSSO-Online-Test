import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Shield, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Unauthorized() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    // Navigate to appropriate dashboard based on user role
    if (!user) {
      navigate('/login');
      return;
    }

    switch (user.role.name.toLowerCase()) {
      case 'admin':
        navigate('/dashboard');
        break;
      case 'zo user':
        navigate('/zo-dashboard');
        break;
      case 'ro user':
        navigate('/ro-dashboard');
        break;
      case 'supervisor':
        navigate('/supervisor-dashboard');
        break;
      case 'enumerator':
        navigate('/enumerator-dashboard');
        break;
      default:
        navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="max-w-md w-full text-center">
        <div className="p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page. Your current role ({user?.role.name}) 
            doesn't include access to this resource.
          </p>
          
          <div className="space-y-3">
            <Button
              onClick={handleGoHome}
              className="w-full flex items-center justify-center space-x-2"
            >
              <Home className="w-4 h-4" />
              <span>Go to Dashboard</span>
            </Button>
            
            <Button
              variant="secondary"
              onClick={handleGoBack}
              className="w-full flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
            </Button>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Need access?</strong> Contact your administrator to request additional permissions for your role.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}