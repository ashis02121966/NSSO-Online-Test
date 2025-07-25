import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout/Layout';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { Modal } from '../components/UI/Modal';
import { enumeratorDashboardApi, certificateApi } from '../services/api';
import { Certificate } from '../types';
import { Award, Download, Eye, Search, Calendar, Trophy, Star, CheckCircle } from 'lucide-react';
import { formatDate } from '../utils';

export function MyCertificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCertificates();
    
    // Check if user just earned a new certificate
    const state = (window.history.state?.usr || window.history.state) as any;
    if (state?.newCertificate) {
      // Refresh certificates to show the new one
      setTimeout(() => {
        fetchCertificates();
      }, 1000);
      
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, []);

  const fetchCertificates = async () => {
    try {
      setIsLoading(true);
      const response = await enumeratorDashboardApi.getDashboardData();
      if (response.success && response.data) {
        setCertificates(response.data.certificates);
      }
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
      const blob = response.data;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Find certificate to get a better filename
      const certificate = certificates.find(cert => cert.id === certificateId);
      const filename = certificate 
        ? `${certificate.certificateNumber}_${certificate.survey.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
        : `certificate_${certificateId}.pdf`;
      
      link.download = filename;
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
      alert('Failed to download certificate. Please try again.');
    }
  };

  const openPreviewModal = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setIsPreviewModalOpen(true);
  };

  const filteredCertificates = certificates.filter(certificate =>
    certificate.survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    certificate.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCertificates = certificates.filter(c => c.status === 'active').length;
  const totalDownloads = certificates.reduce((sum, c) => sum + c.downloadCount, 0);

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Certificates</h1>
            <p className="text-gray-600 mt-2">View and download your earned certificates</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="secondary" className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Download All</span>
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Certificates</p>
                <p className="text-3xl font-bold text-purple-600">{certificates.length}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <Trophy className="w-6 h-6 text-purple-600" />
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
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Downloads</p>
                <p className="text-3xl font-bold text-blue-600">{totalDownloads}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Download className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search certificates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Certificates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-lg"></div>
              </Card>
            ))
          ) : filteredCertificates.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Certificates Yet</h3>
              <p className="text-gray-500">Complete tests to earn certificates</p>
            </div>
          ) : (
            filteredCertificates.map((certificate) => (
              <Card key={certificate.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                {/* Certificate Preview */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-100 p-6 text-center border-b">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Certificate of Completion</h3>
                  <p className="text-sm text-gray-600">eSigma Survey Platform</p>
                </div>

                {/* Certificate Details */}
                <div className="p-6">
                  <h4 className="font-semibold text-gray-900 mb-2">{certificate.survey.title}</h4>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p><span className="font-medium">Certificate #:</span> {certificate.certificateNumber}</p>
                    <p><span className="font-medium">Issued:</span> {formatDate(certificate.issuedAt)}</p>
                    <p><span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        certificate.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {certificate.status.charAt(0).toUpperCase() + certificate.status.slice(1)}
                      </span>
                    </p>
                    <p><span className="font-medium">Downloads:</span> {certificate.downloadCount}</p>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => openPreviewModal(certificate)}
                      variant="secondary"
                      size="sm"
                      className="flex-1 flex items-center justify-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Preview</span>
                    </Button>
                    <Button
                      onClick={() => handleDownloadCertificate(certificate.id)}
                      size="sm"
                      className="flex-1 flex items-center justify-center space-x-2"
                      disabled={certificate.status !== 'active'}
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

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
                    <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
                      <Award className="w-10 h-10 text-white" />
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
                    <div className="flex items-center justify-center space-x-2 text-green-600">
                      <Star className="w-5 h-5 fill-current" />
                      <span className="font-medium">With Excellence</span>
                      <Star className="w-5 h-5 fill-current" />
                    </div>
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
              
              {/* Certificate Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Certificate Details</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Number:</span> {selectedCertificate.certificateNumber}</p>
                    <p><span className="font-medium">Survey:</span> {selectedCertificate.survey.title}</p>
                    <p><span className="font-medium">Issued:</span> {formatDate(selectedCertificate.issuedAt)}</p>
                    <p><span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        selectedCertificate.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedCertificate.status.charAt(0).toUpperCase() + selectedCertificate.status.slice(1)}
                      </span>
                    </p>
                    <p><span className="font-medium">Downloads:</span> {selectedCertificate.downloadCount}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Verification</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Recipient:</span> {selectedCertificate.user.name}</p>
                    <p><span className="font-medium">Email:</span> {selectedCertificate.user.email}</p>
                    <p><span className="font-medium">Role:</span> {selectedCertificate.user.role.name}</p>
                    <div className="flex items-center space-x-2 text-green-600 mt-3">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Verified Certificate</span>
                    </div>
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
                  disabled={selectedCertificate.status !== 'active'}
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