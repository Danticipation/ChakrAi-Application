import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  FileText, 
  Download, 
  Database, 
  Building2, 
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Activity,
  FileDown,
  Settings,
  Users,
  Lock
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUserId } from '../utils/userSession';

interface EHRIntegration {
  id: number;
  ehrSystemType: string;
  integrationStatus: 'pending' | 'active' | 'paused' | 'error';
  lastSync: string;
  syncFrequency: string;
  dataTypes: string[];
  complianceLevel: string;
  isActive: boolean;
}

interface InsuranceEligibility {
  id: number;
  insuranceProvider: string;
  eligibilityStatus: 'eligible' | 'not_eligible' | 'pending_verification';
  coverageType: string;
  copayAmount: string;
  sessionsRemaining: number;
  preAuthRequired: boolean;
}

interface ClinicalExport {
  id: number;
  exportType: string;
  exportFormat: string;
  fileSize: number;
  downloadCount: number;
  generatedAt: string;
  expiresAt: string;
}

export function EHRIntegration() {
  const [activeTab, setActiveTab] = useState<'overview' | 'exports' | 'insurance' | 'compliance'>('overview');
  const [selectedExportType, setSelectedExportType] = useState<'pdf' | 'csv' | 'fhir'>('pdf');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Mock data - in production would be fetched from API
  const ehrIntegrations = [
    {
      id: 1,
      ehrSystemType: 'Epic',
      integrationStatus: 'active' as const,
      lastSync: '2024-01-15T10:30:00Z',
      syncFrequency: 'daily',
      dataTypes: ['sessions', 'assessments', 'progress_notes'],
      complianceLevel: 'hipaa',
      isActive: true
    }
  ];

  const insuranceEligibility = {
    id: 1,
    insuranceProvider: 'Blue Cross Blue Shield',
    eligibilityStatus: 'eligible' as const,
    coverageType: 'Mental Health',
    copayAmount: '$25.00',
    sessionsRemaining: 15,
    preAuthRequired: false
  };

  const clinicalExports = [
    {
      id: 1,
      exportType: 'pdf_report',
      exportFormat: 'pdf',
      fileSize: 1024000,
      downloadCount: 3,
      generatedAt: '2024-01-15T10:30:00Z',
      expiresAt: '2024-02-15T10:30:00Z'
    }
  ];

  const handleGenerateExport = async () => {
    try {
      const response = await fetch(`/api/ehr/export/${selectedExportType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: getCurrentUserId(),
          therapistId: getCurrentUserId(),
          dateRange,
          includedData: ['sessions', 'assessments', 'progress_notes']
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Trigger download
        window.open(result.downloadUrl);
      }
    } catch (error) {
      console.error('Export generation failed:', error);
    }
  };

  const handleInsuranceVerification = async () => {
    try {
      const response = await fetch('/api/insurance/verify-eligibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: getCurrentUserId(),
          therapistId: getCurrentUserId(),
          memberId: 'MEMBER123456',
          insuranceProvider: 'Blue Cross Blue Shield',
          therapistNPI: '1234567890'
        })
      });

      const result = await response.json();
      console.log('Insurance verification:', result);
    } catch (error) {
      console.error('Insurance verification failed:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'eligible':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'pending':
      case 'pending_verification':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'error':
      case 'not_eligible':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen theme-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">EHR Integration & Insurance System</h1>
          <p className="text-white/70">FHIR-compliant healthcare data integration and insurance billing</p>
        </div>

        {/* Navigation Tabs */}
        <div className="w-full bg-[var(--theme-surface)] rounded-lg p-1 mb-6 shadow-lg border-2 border-[var(--theme-accent)]">
          <div className="grid grid-cols-4 gap-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`shimmer-border w-full px-2 py-3 text-xs font-bold rounded-md transition-all border-2 ${
                activeTab === 'overview'
                  ? 'theme-primary text-white border-theme-accent shadow-lg'
                  : 'theme-surface text-white border-theme-accent hover:theme-primary-light'
              }`}
            >
              <Activity className="w-4 h-4 mx-auto mb-1" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('exports')}
              className={`shimmer-border w-full px-2 py-3 text-xs font-bold rounded-md transition-all border-2 ${
                activeTab === 'exports'
                  ? 'theme-primary text-white border-theme-accent shadow-lg'
                  : 'theme-surface text-white border-theme-accent hover:theme-primary-light'
              }`}
            >
              <FileDown className="w-4 h-4 mx-auto mb-1" />
              Exports
            </button>
            <button
              onClick={() => setActiveTab('insurance')}
              className={`shimmer-border w-full px-2 py-3 text-xs font-bold rounded-md transition-all border-2 ${
                activeTab === 'insurance'
                  ? 'theme-primary text-white border-theme-accent shadow-lg'
                  : 'theme-surface text-white border-theme-accent hover:theme-primary-light'
              }`}
            >
              <CreditCard className="w-4 h-4 mx-auto mb-1" />
              Insurance
            </button>
            <button
              onClick={() => setActiveTab('compliance')}
              className={`shimmer-border w-full px-2 py-3 text-xs font-bold rounded-md transition-all border-2 ${
                activeTab === 'compliance'
                  ? 'theme-primary text-white border-theme-accent shadow-lg'
                  : 'theme-surface text-white border-theme-accent hover:theme-primary-light'
              }`}
            >
              <Shield className="w-4 h-4 mx-auto mb-1" />
              Compliance
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* EHR Integration Status */}
            <Card className="theme-surface border-theme-accent/30">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Database className="w-5 h-5 mr-2" />
                  EHR Integration
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ehrIntegrations.map((integration) => (
                  <div key={integration.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white/90">{integration.ehrSystemType}</span>
                      <Badge className={getStatusColor(integration.integrationStatus)}>
                        {integration.integrationStatus}
                      </Badge>
                    </div>
                    <div className="text-sm text-white/70">
                      Last sync: {new Date(integration.lastSync).toLocaleDateString()}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {integration.dataTypes.map((type) => (
                        <Badge key={type} variant="outline" className="text-xs text-white/70 border-white/30">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Insurance Status */}
            <Card className="theme-surface border-theme-accent/30">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Insurance Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/90">{insuranceEligibility.insuranceProvider}</span>
                    <Badge className={getStatusColor(insuranceEligibility.eligibilityStatus)}>
                      {insuranceEligibility.eligibilityStatus}
                    </Badge>
                  </div>
                  <div className="text-sm text-white/70">
                    Coverage: {insuranceEligibility.coverageType}
                  </div>
                  <div className="text-sm text-white/70">
                    Copay: {insuranceEligibility.copayAmount}
                  </div>
                  <div className="text-sm text-white/70">
                    Sessions remaining: {insuranceEligibility.sessionsRemaining}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FHIR Resources */}
            <Card className="theme-surface border-theme-accent/30">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <FileText className="w-5 h-5 mr-2" />
                  FHIR Resources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/90">Patient Records</span>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/90">Encounters</span>
                    <span className="text-white/70">23</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/90">Observations</span>
                    <span className="text-white/70">45</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/90">Care Plans</span>
                    <span className="text-white/70">3</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Clinical Exports Tab */}
        {activeTab === 'exports' && (
          <div className="space-y-6">
            {/* Export Generation */}
            <Card className="theme-surface border-theme-accent/30">
              <CardHeader>
                <CardTitle className="text-white">Generate Clinical Export</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">Export Type</label>
                    <select 
                      value={selectedExportType}
                      onChange={(e) => setSelectedExportType(e.target.value as any)}
                      className="w-full rounded-md border border-white/30 bg-[var(--theme-secondary)] text-white px-3 py-2"
                    >
                      <option value="pdf">PDF Report</option>
                      <option value="csv">CSV Data</option>
                      <option value="fhir">FHIR Bundle</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">Start Date</label>
                    <input 
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                      className="w-full rounded-md border border-white/30 bg-[var(--theme-secondary)] text-white px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">End Date</label>
                    <input 
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                      className="w-full rounded-md border border-white/30 bg-[var(--theme-secondary)] text-white px-3 py-2"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleGenerateExport}
                  className="bg-white text-[#1a237e] hover:bg-white/90"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Generate Export
                </Button>
              </CardContent>
            </Card>

            {/* Recent Exports */}
            <Card className="theme-surface border-theme-accent/30">
              <CardHeader>
                <CardTitle className="text-white">Recent Exports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {clinicalExports.map((export_) => (
                    <div key={export_.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-white/70" />
                        <div>
                          <div className="text-white font-medium">
                            {export_.exportType.replace('_', ' ').toUpperCase()}
                          </div>
                          <div className="text-sm text-white/70">
                            {formatFileSize(export_.fileSize)} • {export_.downloadCount} downloads
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-sm text-white/70">
                          {new Date(export_.generatedAt).toLocaleDateString()}
                        </div>
                        <Button 
                          size="sm"
                          className="bg-white/10 text-white hover:bg-white/20"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Insurance Tab */}
        {activeTab === 'insurance' && (
          <div className="space-y-6">
            {/* Insurance Verification */}
            <Card className="theme-surface border-theme-accent/30">
              <CardHeader>
                <CardTitle className="text-white">Insurance Eligibility Verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">Member ID</label>
                    <input 
                      type="text"
                      placeholder="Enter member ID"
                      className="w-full rounded-md border border-white/30 bg-[var(--theme-secondary)] text-white px-3 py-2 placeholder-white/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">Insurance Provider</label>
                    <select className="w-full rounded-md border border-white/30 bg-[var(--theme-secondary)] text-white px-3 py-2">
                      <option value="">Select Provider</option>
                      <option value="bcbs">Blue Cross Blue Shield</option>
                      <option value="aetna">Aetna</option>
                      <option value="cigna">Cigna</option>
                      <option value="uhc">United Healthcare</option>
                    </select>
                  </div>
                </div>
                <Button 
                  onClick={handleInsuranceVerification}
                  className="bg-white text-[#1a237e] hover:bg-white/90"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Verify Eligibility
                </Button>
              </CardContent>
            </Card>

            {/* Session Billing */}
            <Card className="theme-surface border-theme-accent/30">
              <CardHeader>
                <CardTitle className="text-white">Insurance-Eligible Session Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">Session Type</label>
                    <select className="w-full rounded-md border border-white/30 bg-[var(--theme-secondary)] text-white px-3 py-2">
                      <option value="individual">Individual Therapy</option>
                      <option value="group">Group Therapy</option>
                      <option value="family">Family Therapy</option>
                      <option value="crisis">Crisis Intervention</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">Duration (minutes)</label>
                    <input 
                      type="number"
                      placeholder="45"
                      className="w-full rounded-md border border-white/30 bg-[var(--theme-secondary)] text-white px-3 py-2 placeholder-white/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">Diagnosis Code (ICD-10)</label>
                    <input 
                      type="text"
                      placeholder="F41.1"
                      className="w-full rounded-md border border-white/30 bg-[var(--theme-secondary)] text-white px-3 py-2 placeholder-white/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">Session Date</label>
                    <input 
                      type="date"
                      className="w-full rounded-md border border-white/30 bg-[var(--theme-secondary)] text-white px-3 py-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">Progress Notes</label>
                  <textarea 
                    placeholder="Document therapeutic progress and interventions..."
                    className="w-full rounded-md border border-white/30 bg-[var(--theme-secondary)] text-white px-3 py-2 placeholder-white/50"
                    rows={4}
                  />
                </div>
                <Button className="bg-white text-[#1a237e] hover:bg-white/90">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Generate Insurance Summary
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Compliance Tab */}
        {activeTab === 'compliance' && (
          <div className="space-y-6">
            {/* Compliance Dashboard */}
            <Card className="theme-surface border-theme-accent/30">
              <CardHeader>
                <CardTitle className="text-white">HIPAA Compliance Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 mb-3">
                      <Shield className="w-6 h-6 text-green-300" />
                    </div>
                    <div className="text-2xl font-bold text-white">100%</div>
                    <div className="text-sm text-white/70">Data Encryption</div>
                  </div>
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 mb-3">
                      <Users className="w-6 h-6 text-green-300" />
                    </div>
                    <div className="text-2xl font-bold text-white">Verified</div>
                    <div className="text-sm text-white/70">Access Controls</div>
                  </div>
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 mb-3">
                      <Lock className="w-6 h-6 text-green-300" />
                    </div>
                    <div className="text-2xl font-bold text-white">Active</div>
                    <div className="text-sm text-white/70">Audit Logging</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Audit Logs */}
            <Card className="theme-surface border-theme-accent/30">
              <CardHeader>
                <CardTitle className="text-white">Recent Audit Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { action: 'Data Export', resource: 'Clinical Report', timestamp: '2024-01-15 10:30:00', status: 'success' },
                    { action: 'Access', resource: 'Patient Record', timestamp: '2024-01-15 09:15:00', status: 'success' },
                    { action: 'Sync', resource: 'EHR Integration', timestamp: '2024-01-15 08:00:00', status: 'success' }
                  ].map((log, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <div className="flex items-center space-x-3">
                        <Activity className="w-5 h-5 text-white/70" />
                        <div>
                          <div className="text-white font-medium">{log.action}</div>
                          <div className="text-sm text-white/70">{log.resource}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-sm text-white/70">{log.timestamp}</div>
                        <Badge className={getStatusColor(log.status)}>
                          {log.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default EHRIntegration;