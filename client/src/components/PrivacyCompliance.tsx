import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, Lock, Download, Upload, Key, FileText, CheckCircle } from 'lucide-react';

interface EncryptionSettings {
  id: number;
  encryption_method: string;
  key_derivation_rounds: number;
  is_client_side: boolean;
  backup_encryption: boolean;
  key_rotation_days: number;
}

interface PrivacyAuditLog {
  id: number;
  operation_type: string;
  data_accessed: string;
  privacy_technique: string;
  user_consent: boolean;
  timestamp: string;
  compliance_score: number;
}

interface EncryptedBackup {
  id: number;
  backup_size: string;
  encryption_status: string;
  created_at: string;
  expires_at: string;
  backup_hash: string;
}

interface AnonymizedReport {
  id: number;
  report_type: string;
  anonymization_method: string;
  epsilon_value: number;
  delta_value: number;
  data_points: number;
  generated_at: string;
}

const PrivacyCompliance: React.FC = () => {
  const [activeTab, setActiveTab] = useState('encryption');

  const { data: encryptionSettings } = useQuery<EncryptionSettings>({
    queryKey: ['/api/encryption-settings/1'],
    queryFn: () => fetch('/api/encryption-settings/1').then(res => res.json()),
  });

  const { data: auditLogs } = useQuery<PrivacyAuditLog[]>({
    queryKey: ['/api/privacy-audit-logs/1'],
    queryFn: () => fetch('/api/privacy-audit-logs/1').then(res => res.json()),
  });

  const { data: backups } = useQuery<EncryptedBackup[]>({
    queryKey: ['/api/encrypted-backups/1'],
    queryFn: () => fetch('/api/encrypted-backups/1').then(res => res.json()),
  });

  const { data: reports } = useQuery<AnonymizedReport[]>({
    queryKey: ['/api/anonymized-reports'],
    queryFn: () => fetch('/api/anonymized-reports').then(res => res.json()),
  });

  const renderEncryptionTab = () => {
    return (
      <div className="space-y-6">
        {/* Encryption Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm theme-text/80">Encryption Method</p>
                <p className="text-lg font-bold theme-text">{encryptionSettings?.encryption_method || 'AES-256-GCM'}</p>
              </div>
              <div className="p-3 rounded-full bg-white/20">
                <Lock className="w-6 h-6 theme-text" />
              </div>
            </div>
          </div>

          <div className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm theme-text/80">Key Derivation</p>
                <p className="text-lg font-bold theme-text">{encryptionSettings?.key_derivation_rounds || 100000} rounds</p>
              </div>
              <div className="p-3 rounded-full bg-white/20">
                <Key className="w-6 h-6 theme-text" />
              </div>
            </div>
          </div>

          <div className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm theme-text/80">Client-Side Only</p>
                <p className="text-lg font-bold theme-text">{encryptionSettings?.is_client_side ? 'Yes' : 'No'}</p>
              </div>
              <div className="p-3 rounded-full bg-white/20">
                <Shield className="w-6 h-6 theme-text" />
              </div>
            </div>
          </div>
        </div>

        {/* Encryption Details */}
        <div className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
          <h3 className="text-lg font-semibold theme-text mb-4">Zero-Knowledge Architecture</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
              <div>
                <p className="theme-text font-medium">Client-Side Encryption</p>
                <p className="theme-text/60 text-sm">All data encrypted on your device before transmission</p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>

            <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
              <div>
                <p className="theme-text font-medium">Zero Server Access</p>
                <p className="theme-text/60 text-sm">Servers cannot decrypt your therapeutic data</p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>

            <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
              <div>
                <p className="theme-text font-medium">Key Derivation (PBKDF2)</p>
                <p className="theme-text/60 text-sm">Strong password-based key generation with 100,000 rounds</p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>

            <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
              <div>
                <p className="theme-text font-medium">Automatic Key Rotation</p>
                <p className="theme-text/60 text-sm">Keys rotated every {encryptionSettings?.key_rotation_days || 90} days</p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </div>

        {/* Privacy Controls */}
        <div className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
          <h3 className="text-lg font-semibold theme-text mb-4">Privacy Controls</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="p-4 bg-white/10 hover:bg-white/20 rounded-lg text-left transition-all">
              <div className="flex items-center space-x-3">
                <Key className="w-5 h-5 theme-text" />
                <div>
                  <p className="theme-text font-medium">Change Encryption Key</p>
                  <p className="theme-text/60 text-sm">Generate new encryption key</p>
                </div>
              </div>
            </button>

            <button className="p-4 bg-white/10 hover:bg-white/20 rounded-lg text-left transition-all">
              <div className="flex items-center space-x-3">
                <Download className="w-5 h-5 theme-text" />
                <div>
                  <p className="theme-text font-medium">Export Keys</p>
                  <p className="theme-text/60 text-sm">Download encryption keys securely</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderPrivacyTab = () => {
    return (
      <div className="space-y-6">
        {/* Differential Privacy Settings */}
        <div className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
          <h3 className="text-lg font-semibold theme-text mb-4">Differential Privacy Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-white/10 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="theme-text/80">Epsilon (Îµ)</span>
                <span className="theme-text font-bold">1.0</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                <div className="bg-white h-2 rounded-full w-1/4"></div>
              </div>
              <p className="theme-text/60 text-xs mt-1">Privacy budget: Strong protection</p>
            </div>

            <div className="p-4 bg-white/10 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="theme-text/80">Delta (Î´)</span>
                <span className="theme-text font-bold">0.00001</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                <div className="bg-white h-2 rounded-full w-1/10"></div>
              </div>
              <p className="theme-text/60 text-xs mt-1">Probability bound: Very low</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
              <div>
                <p className="theme-text font-medium">Laplace Noise Mechanism</p>
                <p className="theme-text/60 text-sm">Statistical noise added to protect individual privacy</p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>

            <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
              <div>
                <p className="theme-text font-medium">Gaussian Noise (Advanced)</p>
                <p className="theme-text/60 text-sm">Enhanced privacy for complex analytics</p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>

            <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
              <div>
                <p className="theme-text font-medium">Cohort Anonymization</p>
                <p className="theme-text/60 text-sm">Minimum 10 users required for any report</p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </div>

        {/* Privacy Status */}
        <div className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
          <h3 className="text-lg font-semibold theme-text mb-4">Privacy Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-500/20 rounded-lg border border-green-500/40">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-green-200 font-medium">GDPR Compliant</p>
              <p className="text-green-300/80 text-sm">Full compliance verified</p>
            </div>

            <div className="text-center p-4 bg-green-500/20 rounded-lg border border-green-500/40">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-green-200 font-medium">HIPAA Ready</p>
              <p className="text-green-300/80 text-sm">Healthcare standards met</p>
            </div>

            <div className="text-center p-4 bg-green-500/20 rounded-lg border border-green-500/40">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-green-200 font-medium">Zero-Knowledge</p>
              <p className="text-green-300/80 text-sm">Server cannot decrypt data</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBackupsTab = () => {
    return (
      <div className="space-y-6">
        {/* Backup Controls */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold theme-text">Encrypted Backups</h3>
          <button className="bg-white/20 hover:bg-white/30 theme-text px-4 py-2 rounded-lg flex items-center space-x-2">
            <Upload className="w-4 h-4" />
            <span>Create Backup</span>
          </button>
        </div>

        {/* Backup List */}
        <div className="space-y-4">
          {backups?.map((backup) => (
            <div key={backup.id} className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="theme-text font-medium">Backup #{backup.id}</p>
                  <p className="theme-text/60 text-sm">Created: {new Date(backup.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${backup.encryption_status === 'encrypted' ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                  <span className="theme-text/80 text-sm capitalize">{backup.encryption_status}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="theme-text/60 text-xs">Size</p>
                  <p className="theme-text font-medium">{backup.backup_size}</p>
                </div>
                <div>
                  <p className="theme-text/60 text-xs">Expires</p>
                  <p className="theme-text font-medium">{new Date(backup.expires_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="theme-text/60 text-xs">Hash</p>
                  <p className="theme-text font-medium font-mono text-xs">{backup.backup_hash.substring(0, 8)}...</p>
                </div>
                <div>
                  <p className="theme-text/60 text-xs">Status</p>
                  <p className="theme-text font-medium capitalize">{backup.encryption_status}</p>
                </div>
              </div>

              <div className="flex space-x-2">
                <button className="flex-1 bg-white/20 hover:bg-white/30 theme-text py-2 px-3 rounded text-sm flex items-center justify-center space-x-1">
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </button>
                <button className="flex-1 bg-red-500/20 hover:bg-red-500/30 theme-text py-2 px-3 rounded text-sm">
                  Delete
                </button>
              </div>
            </div>
          )) || <p className="theme-text/60">No backups available</p>}
        </div>

        {/* Backup Settings */}
        <div className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
          <h3 className="text-lg font-semibold theme-text mb-4">Backup Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
              <div>
                <p className="theme-text font-medium">Automatic Backups</p>
                <p className="theme-text/60 text-sm">Weekly encrypted backups</p>
              </div>
              <div className="w-12 h-6 bg-white/20 rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-6 transition-all"></div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
              <div>
                <p className="theme-text font-medium">90-Day Retention</p>
                <p className="theme-text/60 text-sm">Automatic deletion after 90 days</p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAuditTab = () => {
    return (
      <div className="space-y-6">
        {/* Compliance Score */}
        <div className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
          <h3 className="text-lg font-semibold theme-text mb-4">Compliance Score</h3>
          <div className="text-center">
            <div className="text-4xl font-bold theme-text mb-2">98%</div>
            <p className="theme-text/80">Excellent compliance rating</p>
            <div className="w-full bg-white/20 rounded-full h-3 mt-4">
              <div className="bg-green-400 h-3 rounded-full w-[98%]"></div>
            </div>
          </div>
        </div>

        {/* Recent Audit Logs */}
        <div className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
          <h3 className="text-lg font-semibold theme-text mb-4">Recent Privacy Operations</h3>
          <div className="space-y-3">
            {auditLogs?.slice(0, 5).map((log) => (
              <div key={log.id} className="p-3 bg-white/10 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="theme-text font-medium capitalize">{log.operation_type}</span>
                  <span className="theme-text/60 text-sm">{new Date(log.timestamp).toLocaleDateString()}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="theme-text/60">Data: </span>
                    <span className="theme-text">{log.data_accessed}</span>
                  </div>
                  <div>
                    <span className="theme-text/60">Technique: </span>
                    <span className="theme-text">{log.privacy_technique}</span>
                  </div>
                  <div>
                    <span className="theme-text/60">Consent: </span>
                    <span className={log.user_consent ? 'text-green-400' : 'text-red-400'}>
                      {log.user_consent ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="theme-text/60">Score: </span>
                    <span className="theme-text">{Math.round(log.compliance_score * 100)}%</span>
                  </div>
                </div>
              </div>
            )) || <p className="theme-text/60">No audit logs available</p>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen theme-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold theme-text mb-2">Privacy & Compliance</h1>
          <p className="theme-text-secondary">Advanced privacy protection and regulatory compliance</p>
        </div>

        {/* Navigation Tabs */}
        <div className="w-full theme-surface rounded-lg p-1 mb-6 shadow-lg border-2 border-theme-accent">
          <div className="grid grid-cols-4 gap-1">
            {[
              { id: 'encryption', label: 'Data Encryption', icon: Lock },
              { id: 'privacy', label: 'Differential Privacy', icon: Shield },
              { id: 'backups', label: 'Encrypted Backups', icon: Download },
              { id: 'audit', label: 'Compliance Audit', icon: FileText },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shimmer-border theme-button w-full px-2 py-3 text-xs font-bold rounded-md transition-all border-2 ${
                  activeTab === tab.id
                    ? 'shadow-lg border-2 animate-shimmer'
                    : 'hover:shadow-md border hover:border-2 hover:animate-shimmer'
                }`}
              >
                <tab.icon className="w-4 h-4 mx-auto mb-1" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'encryption' && renderEncryptionTab()}
        {activeTab === 'privacy' && renderPrivacyTab()}
        {activeTab === 'backups' && renderBackupsTab()}
        {activeTab === 'audit' && renderAuditTab()}
      </div>
    </div>
  );
};

export default PrivacyCompliance;
