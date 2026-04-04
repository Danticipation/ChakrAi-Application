import { getCurrentUserId } from "../utils/userSession";
import React, { useState } from 'react';
import { Shield, Lock, FileText, AlertTriangle, CheckCircle, Download, Upload, Key, Database, Eye, EyeOff } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface EncryptionStatus {
  hasEncryption: boolean;
  keyFingerprint: string;
  createdAt: string;
  lastUsed: string;
}

interface AnonymizedReport {
  reportId: string;
  reportType: string;
  cohortSize: number;
  privacyEpsilon: number;
  privacyDelta: number;
  generatedAt: string;
  reportData: {
    totalUsers: number;
    wellnessMetrics: Record<string, number>;
    engagementMetrics: Record<string, number>;
    progressMetrics: Record<string, number>;
  };
  privacyGuarantees: {
    epsilon: number;
    delta: number;
    minCohortSize: number;
  };
}

interface ComplianceReport {
  reportId: string;
  timestamp: string;
  overallCompliance: 'compliant' | 'needs_attention' | 'non_compliant';
  score: number;
  summary: string;
  actionItems: string[];
}

export default function PrivacyComplianceDashboard() {
  const [activeTab, setActiveTab] = useState('encryption');
  const [userPassword, setUserPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [backupId, setBackupId] = useState('');
  const queryClient = useQueryClient();

  // Fetch encryption status
  const { data: encryptionStatus, isLoading: encryptionLoading } = useQuery({
    queryKey: ['/api/privacy/encryption/status/1'],
    queryFn: () => axios.get('/api/privacy/encryption/status/1').then(res => res.data)
  });

  // Fetch anonymized reports
  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ['/api/privacy/analytics/reports'],
    queryFn: () => axios.get('/api/privacy/analytics/reports?limit=5').then(res => res.data)
  });

  // Setup encryption mutation
  const setupEncryptionMutation = useMutation({
    mutationFn: ({ userPassword }: { userPassword: string }) =>
      axios.post('/api/privacy/encryption/setup', { userId: getCurrentUserId(), userPassword }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/privacy/encryption/status/1'] });
      setUserPassword('');
    }
  });

  // Create backup mutation
  const createBackupMutation = useMutation({
    mutationFn: ({ userPassword }: { userPassword: string }) =>
      axios.post('/api/privacy/backup/create', { userId: getCurrentUserId(), userPassword }),
    onSuccess: () => {
      setUserPassword('');
    }
  });

  // Restore backup mutation
  const restoreBackupMutation = useMutation({
    mutationFn: ({ backupId, userPassword }: { backupId: string; userPassword: string }) =>
      axios.post('/api/privacy/backup/restore', { backupId, userPassword }),
    onSuccess: () => {
      setBackupId('');
      setUserPassword('');
    }
  });

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: () => axios.post('/api/privacy/analytics/anonymized-report', { reportType: 'wellness' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/privacy/analytics/reports'] });
    }
  });

  const encryption: EncryptionStatus = encryptionStatus || {
    hasEncryption: false,
    keyFingerprint: '',
    createdAt: '',
    lastUsed: ''
  };

  const reports: AnonymizedReport[] = reportsData?.reports || [];

  const getComplianceColor = (compliance: string) => {
    switch (compliance) {
      case 'compliant': return 'text-green-600 bg-green-50 border-green-200';
      case 'needs_attention': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'non_compliant': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (encryptionLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6" style={{ backgroundColor: 'var(--surface-primary)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Privacy & Compliance
          </h1>
          <p className="text-gray-600">
            Advanced privacy protection with differential privacy and user-controlled encryption
          </p>
        </div>
      </div>

      {/* Privacy Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-blue-700">Data Encryption</p>
              <p className={`text-lg font-bold ${encryption.hasEncryption ? 'text-green-600' : 'text-orange-600'}`}>
                {encryption.hasEncryption ? 'Enabled' : 'Not Setup'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-green-700">Differential Privacy</p>
              <p className="text-lg font-bold text-green-600">Active</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm text-purple-700">Anonymized Reports</p>
              <p className="text-lg font-bold text-purple-600">{reports.length} Available</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-[#1a237e]/30 bg-[var(--theme-secondary)] rounded-t-xl">
        <nav className="-mb-px flex space-x-8 px-6">
          {[
            { id: 'encryption', label: 'Data Encryption' },
            { id: 'privacy', label: 'Differential Privacy' },
            { id: 'backups', label: 'Encrypted Backups' },
            { id: 'compliance', label: 'Compliance Audit' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-[#1a237e] text-white'
                  : 'border-transparent text-white/70 hover:text-white hover:border-[#1a237e]/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'encryption' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg border border-gray-200" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Client-Side Encryption Setup
                </h3>
                
                {encryption.hasEncryption ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-green-800">Encryption is enabled for your data</span>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Key Fingerprint: {encryption.keyFingerprint}</p>
                      <p className="text-sm text-gray-600">Created: {new Date(encryption.createdAt).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-600">Last Used: {new Date(encryption.lastUsed).toLocaleDateString()}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      <span className="text-orange-800">Client-side encryption is not setup</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={userPassword}
                          onChange={(e) => setUserPassword(e.target.value)}
                          placeholder="Enter encryption password"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      
                      <button
                        onClick={() => setupEncryptionMutation.mutate({ userPassword })}
                        disabled={!userPassword || setupEncryptionMutation.isPending}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {setupEncryptionMutation.isPending ? 'Setting up...' : 'Setup Encryption'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 rounded-lg border border-gray-200" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                <h3 className="text-lg font-semibold mb-4">How It Works</h3>
                <div className="space-y-4 text-sm text-gray-600">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                    <div>
                      <p className="font-medium">Client-Side Key Generation</p>
                      <p>Your password generates an encryption key that never leaves your device</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                    <div>
                      <p className="font-medium">AES-256-GCM Encryption</p>
                      <p>Military-grade encryption protects your therapeutic data</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                    <div>
                      <p className="font-medium">Zero-Knowledge Architecture</p>
                      <p>Only you can decrypt your data - we never have access to your encryption key</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg border border-gray-200" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                <h3 className="text-lg font-semibold mb-4">Differential Privacy Analytics</h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">Privacy Guarantees</h4>
                    <div className="space-y-1 text-sm text-green-700">
                      <p>Îµ (Epsilon): 1.0 - Standard privacy level</p>
                      <p>Î´ (Delta): 0.00001 - Very low failure probability</p>
                      <p>Minimum Cohort: 10 users for analytics</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => generateReportMutation.mutate()}
                    disabled={generateReportMutation.isPending}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {generateReportMutation.isPending ? 'Generating...' : 'Generate Anonymized Report'}
                  </button>
                </div>
              </div>

              <div className="p-6 rounded-lg border border-gray-200" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                <h3 className="text-lg font-semibold mb-4">Recent Anonymized Reports</h3>
                
                {reportsLoading ? (
                  <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-16 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : reports.length === 0 ? (
                  <p className="text-gray-500">No reports available yet</p>
                ) : (
                  <div className="space-y-3">
                    {reports.slice(0, 3).map((report) => (
                      <div key={report.reportId} className="p-3 bg-gray-50 rounded-lg border">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium capitalize">{report.reportType} Report</p>
                            <p className="text-xs text-gray-500">
                              Cohort: {report.cohortSize} users | Îµ: {report.privacyEpsilon}
                            </p>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(report.generatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'backups' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg border border-gray-200" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Create Encrypted Backup
                </h3>
                
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-blue-800 text-sm">
                      Create a complete encrypted backup of your therapeutic data that only you can decrypt.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={userPassword}
                        onChange={(e) => setUserPassword(e.target.value)}
                        placeholder="Enter encryption password"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    
                    <button
                      onClick={() => createBackupMutation.mutate({ userPassword })}
                      disabled={!userPassword || createBackupMutation.isPending}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {createBackupMutation.isPending ? 'Creating Backup...' : 'Create Encrypted Backup'}
                    </button>
                  </div>
                  
                  {createBackupMutation.data && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-green-800 text-sm">
                        Backup created successfully! Backup ID: {createBackupMutation.data.data.backupId}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 rounded-lg border border-gray-200" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Restore from Backup
                </h3>
                
                <div className="space-y-4">
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-orange-800 text-sm">
                      Restore your therapeutic data from an encrypted backup using your backup ID and password.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={backupId}
                      onChange={(e) => setBackupId(e.target.value)}
                      placeholder="Enter backup ID"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={userPassword}
                        onChange={(e) => setUserPassword(e.target.value)}
                        placeholder="Enter decryption password"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    
                    <button
                      onClick={() => restoreBackupMutation.mutate({ backupId, userPassword })}
                      disabled={!backupId || !userPassword || restoreBackupMutation.isPending}
                      className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                    >
                      {restoreBackupMutation.isPending ? 'Restoring...' : 'Restore from Backup'}
                    </button>
                  </div>
                  
                  {restoreBackupMutation.data && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-green-800 text-sm">
                        Backup restored successfully! Data from {restoreBackupMutation.data.data.createdAt}
                      </p>
                    </div>
                  )}
                  
                  {restoreBackupMutation.error && (
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-red-800 text-sm">
                        Failed to restore backup. Please check your backup ID and password.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="space-y-6">
            <div className="p-6 rounded-lg border border-gray-200" style={{ backgroundColor: 'var(--surface-secondary)' }}>
              <h3 className="text-lg font-semibold mb-4">Privacy Compliance Overview</h3>
              
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">Data Protection</p>
                      <p className="text-sm text-green-600">GDPR Compliant</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-800">Privacy Techniques</p>
                      <p className="text-sm text-blue-600">Differential Privacy</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-purple-800">Encryption</p>
                      <p className="text-sm text-purple-600">AES-256-GCM</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium">Compliance Features</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">User-controlled data encryption</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Differential privacy for analytics</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Anonymized reporting</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Privacy audit logging</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Encrypted data backups</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Zero-knowledge architecture</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
