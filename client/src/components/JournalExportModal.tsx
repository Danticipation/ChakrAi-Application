import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Download, FileText, Users, X, Check } from 'lucide-react';
import type { JournalEntry } from '../../../shared/schema';
import { subDays, subMonths } from 'date-fns';

interface JournalExportModalProps {
  userId: number;
  entries: JournalEntry[];
  onClose: () => void;
}

interface ExportConfig {
  format: 'therapist_report' | 'personal_insights' | 'csv_data';
  dateRange: 'last_week' | 'last_month' | 'last_3_months' | 'all_time' | 'custom';
  customStartDate?: string;
  customEndDate?: string;
  includeAnalytics: boolean;
  recipientType: 'therapist' | 'self' | 'medical_professional';
}

export default function JournalExportModal({ userId, entries, onClose }: JournalExportModalProps) {
  const [config, setConfig] = useState<ExportConfig>({
    format: 'therapist_report',
    dateRange: 'last_month',
    includeAnalytics: true,
    recipientType: 'therapist'
  });
  const [step, setStep] = useState<'config' | 'preview' | 'complete'>('config');
  const [exportData, setExportData] = useState<any>(null);

  const { toast } = useToast();

  const exportMutation = useMutation({
    mutationFn: async (exportConfig: ExportConfig) => {
      const response = await fetch('/api/journal/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...exportConfig
        })
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setExportData(data);
      setStep('preview');
    },
    onError: (error) => {
      toast({
        title: "Export Failed",
        description: "Unable to generate export. Please try again.",
        variant: "destructive",
      });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/journal/export/${exportData.id}/download`);
      return await response.json();
    },
    onSuccess: (response) => {
      // Create download link
      const blob = new Blob([response.content], { type: response.mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = response.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setStep('complete');
      toast({
        title: "Download Complete",
        description: "Your journal export has been downloaded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Download Failed",
        description: "Unable to download export. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getDateRange = () => {
    const now = new Date();
    switch (config.dateRange) {
      case 'last_week':
        return { start: subDays(now, 7), end: now };
      case 'last_month':
        return { start: subMonths(now, 1), end: now };
      case 'last_3_months':
        return { start: subMonths(now, 3), end: now };
      case 'custom':
        return {
          start: config.customStartDate ? new Date(config.customStartDate) : subMonths(now, 1),
          end: config.customEndDate ? new Date(config.customEndDate) : now
        };
      default:
        return { start: new Date(2020, 0, 1), end: now };
    }
  };

  const getFilteredEntries = () => {
    if (config.dateRange === 'all_time') return entries;
    
    const { start, end } = getDateRange();
    return entries.filter(entry => {
      const entryDate = new Date(entry.createdAt!);
      return entryDate >= start && entryDate <= end;
    });
  };

  const handleExport = () => {
    exportMutation.mutate(config);
  };

  const handleDownload = () => {
    downloadMutation.mutate();
  };

  const renderConfigStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Export Configuration
        </h3>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          Configure your journal export for sharing with mental health professionals or personal use.
        </p>
      </div>

      {/* Export Format */}
      <div className="space-y-3">
        <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Export Format
        </label>
        <div className="space-y-2">
          {[
            {
              value: 'therapist_report',
              label: 'Therapist Report',
              description: 'Professional summary with AI insights and clinical recommendations',
              icon: Users
            },
            {
              value: 'personal_insights',
              label: 'Personal Insights',
              description: 'Your emotional journey and growth patterns for self-reflection',
              icon: FileText
            },
            {
              value: 'csv_data',
              label: 'Raw Data (CSV)',
              description: 'Structured data export for analysis or backup',
              icon: Download
            }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setConfig(prev => ({ ...prev, format: option.value as any }))}
              className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                config.format === option.value ? 'border-opacity-100' : 'border-transparent'
              }`}
              style={{ 
                backgroundColor: config.format === option.value ? 'var(--soft-blue)' : 'var(--surface-secondary)',
                borderColor: config.format === option.value ? 'var(--soft-blue-dark)' : 'transparent'
              }}
            >
              <div className="flex items-start gap-3">
                <option.icon className="w-5 h-5 mt-0.5" style={{ color: 'var(--soft-blue-dark)' }} />
                <div>
                  <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                    {option.label}
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {option.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Date Range */}
      <div className="space-y-3">
        <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Date Range
        </label>
        <select
          value={config.dateRange}
          onChange={(e) => setConfig(prev => ({ ...prev, dateRange: e.target.value as any }))}
          className="w-full px-3 py-2 rounded-lg border text-sm"
          style={{ 
            borderColor: 'var(--gentle-lavender-dark)',
            backgroundColor: 'white',
            color: 'var(--text-primary)'
          }}
        >
          <option value="last_week">Last Week</option>
          <option value="last_month">Last Month</option>
          <option value="last_3_months">Last 3 Months</option>
          <option value="all_time">All Time</option>
          <option value="custom">Custom Range</option>
        </select>

        {config.dateRange === 'custom' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Start Date
              </label>
              <input
                type="date"
                value={config.customStartDate || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, customStartDate: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ 
                  borderColor: 'var(--gentle-lavender-dark)',
                  backgroundColor: 'white',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                End Date
              </label>
              <input
                type="date"
                value={config.customEndDate || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, customEndDate: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ 
                  borderColor: 'var(--gentle-lavender-dark)',
                  backgroundColor: 'white',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Recipient Type */}
      <div className="space-y-3">
        <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Intended Recipient
        </label>
        <select
          value={config.recipientType}
          onChange={(e) => setConfig(prev => ({ ...prev, recipientType: e.target.value as any }))}
          className="w-full px-3 py-2 rounded-lg border text-sm"
          style={{ 
            borderColor: 'var(--gentle-lavender-dark)',
            backgroundColor: 'white',
            color: 'var(--text-primary)'
          }}
        >
          <option value="therapist">Therapist/Counselor</option>
          <option value="medical_professional">Medical Professional</option>
          <option value="self">Personal Use</option>
        </select>
      </div>

      {/* Include Analytics */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="includeAnalytics"
          checked={config.includeAnalytics}
          onChange={(e) => setConfig(prev => ({ ...prev, includeAnalytics: e.target.checked }))}
          className="w-4 h-4 rounded"
        />
        <label htmlFor="includeAnalytics" className="text-sm" style={{ color: 'var(--text-primary)' }}>
          Include AI analysis and insights
        </label>
      </div>

      {/* Summary */}
      <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--gentle-lavender)' }}>
        <div className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          Export Summary
        </div>
        <div className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
          <div>Entries: {getFilteredEntries().length} of {entries.length}</div>
          <div>Format: {config.format.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
          <div>Recipient: {config.recipientType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
        </div>
      </div>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Export Preview
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Your export is ready for download. Review the summary below.
        </p>
      </div>

      {exportData && (
        <div className="space-y-4">
          <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--surface-secondary)' }}>
            <h4 className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
              Export Details
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Format:</span>
                <div style={{ color: 'var(--text-primary)' }}>{exportData.format}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Entries:</span>
                <div style={{ color: 'var(--text-primary)' }}>{exportData.entryCount}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Date Range:</span>
                <div style={{ color: 'var(--text-primary)' }}>{exportData.dateRange}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>File Size:</span>
                <div style={{ color: 'var(--text-primary)' }}>{exportData.fileSize}</div>
              </div>
            </div>
          </div>

          {exportData.summary && (
            <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--gentle-lavender)' }}>
              <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Content Summary
              </h4>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {exportData.summary}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderCompleteStep = () => (
    <div className="text-center space-y-4">
      <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--pale-green)' }}>
        <Check className="w-8 h-8" style={{ color: 'var(--soft-blue-dark)' }} />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Export Complete
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Your journal export has been downloaded successfully. You can now share it with your mental health professional or use it for personal reflection.
        </p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="w-full max-w-lg max-h-[90vh] rounded-2xl shadow-lg overflow-hidden"
        style={{ backgroundColor: 'white' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--gentle-lavender-dark)' }}>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Export Journal
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {step === 'config' && renderConfigStep()}
          {step === 'preview' && renderPreviewStep()}
          {step === 'complete' && renderCompleteStep()}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex gap-3" style={{ borderColor: 'var(--gentle-lavender-dark)' }}>
          {step === 'config' && (
            <>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium"
                style={{ 
                  backgroundColor: 'var(--surface-secondary)',
                  color: 'var(--text-primary)'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={exportMutation.isPending || getFilteredEntries().length === 0}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{ 
                  backgroundColor: 'var(--soft-blue-dark)',
                  color: 'white'
                }}
              >
                {exportMutation.isPending ? 'Generating...' : 'Generate Export'}
              </button>
            </>
          )}

          {step === 'preview' && (
            <>
              <button
                onClick={() => setStep('config')}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium"
                style={{ 
                  backgroundColor: 'var(--surface-secondary)',
                  color: 'var(--text-primary)'
                }}
              >
                Back
              </button>
              <button
                onClick={handleDownload}
                disabled={downloadMutation.isPending}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{ 
                  backgroundColor: 'var(--soft-blue-dark)',
                  color: 'white'
                }}
              >
                {downloadMutation.isPending ? 'Downloading...' : 'Download'}
              </button>
            </>
          )}

          {step === 'complete' && (
            <button
              onClick={onClose}
              className="w-full px-4 py-2 rounded-lg text-sm font-medium"
              style={{ 
                backgroundColor: 'var(--soft-blue-dark)',
                color: 'white'
              }}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

