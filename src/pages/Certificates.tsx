import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout/Layout';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { Modal } from '../components/UI/Modal';
import { certificateApi } from '../services/api';
import { Certificate } from '../types';
import { Search, Download, Eye, Award, Calendar, User, FileText, Filter, RefreshCw } from 'lucide-react';
import { formatDateTime, formatDate } from '../utils';

export function Certificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setIsLoading(true);
      const response = await certificateApi.getCertificates();
      setCertificates(response.data);
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCertificate = async (certificateId: string) => {
    try {
      const response = await certificateApi.downloadCertificate(certificateId);
      // Handle PDF download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificate_${certificateId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Update download count
      setCertificates(certificates.map(cert => 
        cert.id === certificateId 
          ? { ...cert, downloadCount: cert.downloadCount + 1 }
          : cert
      ));
    } catch (error) {
      console.error('Failed to download certificate:', error);
    }
  };

  const handleRevokeCertificate = async (certificateId: string) => {
    if (window.confirm('Are you sure you want to revoke this certificate? This action cannot be undone.')) {
      try {
        const response = await certificateApi.revokeCertificate(certificateId);
        if (response.success) {
          setCertificates(certificates.map(cert => 
            cert.id === certificateId 
              ? { ...cert, status: 'revoked' }
              : cert
          ));
        }
      } catch (error) {
        console.error('Failed to revoke certificate:', error);
      }
    }
  };

  const openPreviewModal = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setIsPreviewModalOpen(true);
  };

  const getStatusColor = (status: Certificate['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'revoked':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCertificates = certificates.filter(certificate => {
    const matchesSearch = certificate.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         certificate.survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         certificate.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || certificate.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const now = new Date();
      const certDate = new Date(certificate.issuedAt);
      switch (dateFilter) {
        case 'today':
          matchesDate = certDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = certDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = certDate >= monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalCertificates = certificates.length;
  const activeCertificates = certificates.filter(c => c.status === 'active').length;
  const revokedCertificates = certificates.filter(c => c.status === 'revoked').length;
  const totalDownloads = certificates.reduce((sum, c) => sum + c.downloadCount, 0);

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Certificate Management</h1>
            <p className="text-gray-600 mt-2">Manage and track all issued certificates</p>
          </div>
          <Button
            onClick={fetchCertificates}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Certificates</p>
                <p className="text-3xl font-bold text-gray-900">{totalCertificates}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-3xl font-bold text-green-600">{activeCertificates}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revoked</p>
                <p className="text-3xl font-bold text-red-600">{revokedCertificates}</p>
              </div>
              <div className="p-3 rounded-full bg-red-100">
                <RefreshCw className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Downloads</p>
                <p className="text-3xl font-bold text-purple-600">{totalDownloads}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <Download className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search certificates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="revoked">Revoked</option>
                <option value="expired">Expired</option>
              </select>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Certificates Table */}
        <Card>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading certificates...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Certificate</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">User</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Survey</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Issued</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Downloads</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCertificates.map((certificate) => (
                    <tr key={certificate.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-yellow-100 rounded-lg">
                            <Award className="w-5 h-5 text-yellow-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{certificate.certificateNumber}</p>
                            <p className="text-sm text-gray-500">ID: {certificate.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{certificate.user.name}</p>
                          <p className="text-sm text-gray-500">{certificate.user.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{certificate.survey.title}</p>
                          <p className="text-sm text-gray-500">{certificate.user.role.name}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(certificate.status)}`}>
                          {certificate.status.charAt(0).toUpperCase() + certificate.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm text-gray-900">{formatDate(certificate.issuedAt)}</p>
                          <p className="text-xs text-gray-500">{formatDateTime(certificate.issuedAt)}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-gray-900">{certificate.downloadCount}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openPreviewModal(certificate)}
                            className="p-1 text-blue-600 hover:text-blue-700"
                            title="Preview Certificate"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadCertificate(certificate.id)}
                            className="p-1 text-green-600 hover:text-green-700"
                            title="Download Certificate"
                            disabled={certificate.status === 'revoked'}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          {certificate.status === 'active' && (
                            <button
                              onClick={() => handleRevokeCertificate(certificate.id)}
                              className="p-1 text-red-600 hover:text-red-700"
                              title="Revoke Certificate"
                            >
                              <RefreshCw className="w-4 h-4" />
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

        {/* Certificate Preview Modal */}
        <Modal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          title="Certificate Preview"
          size="xl"
        >
          {selectedCertificate && (
            <div className="space-y-6">
              {/* Certificate Preview */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-lg border-2 border-blue-200">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                      <Award className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Certificate of Completion</h2>
                    <p className="text-lg text-gray-600">eSigma Survey Platform</p>
                  </div>
                  
                  <div className="py-6">
                    <p className="text-lg text-gray-700 mb-2">This is to certify that</p>
                    <h3 className="text-2xl font-bold text-blue-600 mb-2">{selectedCertificate.user.name}</h3>
                    <p className="text-lg text-gray-700 mb-2">has successfully completed</p>
                    <h4 className="text-xl font-semibold text-gray-900 mb-4">{selectedCertificate.survey.title}</h4>
                  </div>
                  
                  <div className="flex justify-between items-center pt-6 border-t border-blue-200">
                    <div>
                      <p className="text-sm text-gray-600">Certificate Number</p>
                      <p className="font-mono text-sm font-medium">{selectedCertificate.certificateNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date Issued</p>
                      <p className="text-sm font-medium">{formatDate(selectedCertificate.issuedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Certificate Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Certificate Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Number:</span> {selectedCertificate.certificateNumber}</p>
                    <p><span className="font-medium">Status:</span> 
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedCertificate.status)}`}>
                        {selectedCertificate.status.charAt(0).toUpperCase() + selectedCertificate.status.slice(1)}
                      </span>
                    </p>
                    <p><span className="font-medium">Issued:</span> {formatDateTime(selectedCertificate.issuedAt)}</p>
                    <p><span className="font-medium">Downloads:</span> {selectedCertificate.downloadCount}</p>
                    {selectedCertificate.validUntil && (
                      <p><span className="font-medium">Valid Until:</span> {formatDate(selectedCertificate.validUntil)}</p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Recipient Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedCertificate.user.name}</p>
                    <p><span className="font-medium">Email:</span> {selectedCertificate.user.email}</p>
                    <p><span className="font-medium">Role:</span> {selectedCertificate.user.role.name}</p>
                    <p><span className="font-medium">Jurisdiction:</span> {selectedCertificate.user.jurisdiction || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="secondary"
                  onClick={() => setIsPreviewModalOpen(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => handleDownloadCertificate(selectedCertificate.id)}
                  disabled={selectedCertificate.status === 'revoked'}
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
}