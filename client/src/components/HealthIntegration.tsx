import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  Activity, 
  Heart, 
  TrendingUp, 
  Zap, 
  Shield, 
  Smartphone, 
  CheckCircle, 
  Clock, 
  WifiOff, 
  AlertCircle, 
  Wifi 
} from 'lucide-react';

// Types
interface WearableDevice {
  id: number;
  userId: number;
  deviceType: string;
  deviceName: string;
  syncStatus: string;
  lastSyncTime: string;
  consentGranted: boolean;
  privacyLevel: string;
}

interface HealthMetric {
  id: number;
  userId: number;
  metricType: string;
  metricValue: string;
  unit: string;
  recordedAt: string;
  dataQuality: string;
  contextTags: string[];
}

interface HealthCorrelation {
  id: number;
  userId: number;
  healthMetric: string;
  emotionalState: string;
  correlationStrength: string;
  confidenceScore: string;
  timeframe: string;
  insights: string;
}

interface HealthInsight {
  id: number;
  userId: number;
  insightType: string;
  title: string;
  description: string;
  priority: string;
  isRead: boolean;
  actionable: boolean;
}

interface SyncLog {
  id: number;
  deviceId: number;
  syncStatus: string;
  syncTimestamp: string;
  recordsProcessed: number;
  errorMessage: string;
}

interface PrivacySettings {
  id: number;
  userId: number;
  healthDataSharing: boolean;
  anonymizedReporting: boolean;
  thirdPartyAccess: boolean;
  dataRetentionDays: number;
}

const HealthIntegration: React.FC = () => {
  const [activeTab, setActiveTab] = useState('devices');
  const [syncingDevice, setSyncingDevice] = useState<number | null>(null);

  const { data: devices = [] } = useQuery<WearableDevice[]>({
    queryKey: ['/api/wearable-devices/1'],
    queryFn: () => axios.get('/api/wearable-devices/1').then(res => Array.isArray(res.data) ? res.data : [])
  });

  const { data: healthMetrics = [] } = useQuery<HealthMetric[]>({
    queryKey: ['/api/health-metrics/1'],
    queryFn: () => axios.get('/api/health-metrics/1').then(res => Array.isArray(res.data) ? res.data : [])
  });

  const { data: correlations = [] } = useQuery<HealthCorrelation[]>({
    queryKey: ['/api/health-correlations/1'],
    queryFn: () => axios.get('/api/health-correlations/1').then(res => Array.isArray(res.data) ? res.data : [])
  });

  const { data: insights = [] } = useQuery<HealthInsight[]>({
    queryKey: ['/api/health-insights/1'],
    queryFn: () => axios.get('/api/health-insights/1').then(res => Array.isArray(res.data) ? res.data : [])
  });

  const { data: syncLogs = [] } = useQuery<SyncLog[]>({
    queryKey: ['/api/device-sync-logs/1'],
    queryFn: () => axios.get('/api/device-sync-logs/1').then(res => Array.isArray(res.data) ? res.data : [])
  });

  const { data: privacySettings } = useQuery<PrivacySettings>({
    queryKey: ['/api/health-privacy/1'],
    queryFn: () => axios.get('/api/health-privacy/1').then(res => res.data)
  });

  const syncDevice = async (deviceId: number) => {
    try {
      setSyncingDevice(deviceId);
      await axios.post('/api/sync-device', { deviceId, userId: 1 });
      setTimeout(() => {
        setSyncingDevice(null);
        window.location.reload();
      }, 3000);
    } catch (error) {
      console.error('Failed to sync device:', error);
      setSyncingDevice(null);
    }
  };

  const updatePrivacySettings = async (settings: Partial<PrivacySettings>) => {
    try {
      await axios.patch('/api/health-privacy/1', settings);
      window.location.reload();
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
    }
  };

  const connectDevice = async (deviceType: string) => {
    try {
      await axios.post('/api/connect-device', { userId: 1, deviceType });
      window.location.reload();
    } catch (error) {
      console.error('Failed to connect device:', error);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'apple_watch': return '⌚';
      case 'fitbit': return '📱';
      case 'garmin': return '🏃';
      case 'samsung_health': return '📲';
      case 'polar': return '❤️';
      default: return '📱';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'syncing': return 'text-blue-600';
      case 'disconnected': return 'text-red-600';
      case 'error': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return CheckCircle;
      case 'syncing': return Clock;
      case 'disconnected': return WifiOff;
      case 'error': return AlertCircle;
      default: return Wifi;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMetricIcon = (metricType: string) => {
    switch (metricType) {
      case 'heart_rate': return Heart;
      case 'steps': return Activity;
      case 'sleep_quality': return Clock;
      case 'stress_level': return AlertCircle;
      case 'activity_minutes': return Zap;
      default: return TrendingUp;
    }
  };

  // Safely get connected devices count
  const connectedDevicesCount = Array.isArray(devices) ? devices.filter(d => d.syncStatus === 'connected').length : 0;
  
  // Safely get unread insights count
  const unreadInsightsCount = Array.isArray(insights) ? insights.filter(i => !i.isRead).length : 0;
  
  // Safely get successful syncs count
  const successfulSyncsCount = Array.isArray(syncLogs) ? syncLogs.filter(l => l.syncStatus === 'success').length : 0;

  return (
    <div className="h-full bg-gradient-to-br from-[#E6E6FA] to-[#ADD8E6] p-4 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Activity className="text-green-600" />
                Health Integration & Wearables
              </h1>
              <p className="text-gray-600 mt-2">Connect your devices and discover health-emotion correlations</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-green-600">{connectedDevicesCount} Connected</div>
              <div className="text-sm text-gray-600">Active Devices</div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/40 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-blue-600">{healthMetrics.length}</div>
              <div className="text-xs text-gray-600">Health Metrics</div>
            </div>
            <div className="bg-white/40 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-purple-600">{correlations.length}</div>
              <div className="text-xs text-gray-600">Correlations Found</div>
            </div>
            <div className="bg-white/40 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-orange-600">{unreadInsightsCount}</div>
              <div className="text-xs text-gray-600">New Insights</div>
            </div>
            <div className="bg-white/40 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-green-600">{successfulSyncsCount}</div>
              <div className="text-xs text-gray-600">Successful Syncs</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-[#1a237e]/20 backdrop-blur-sm rounded-xl mb-6 border border-[#1a237e]/30">
          <div className="flex">
            {[
              { id: 'devices', label: 'My Devices', icon: Smartphone },
              { id: 'metrics', label: 'Health Data', icon: Heart },
              { id: 'correlations', label: 'Correlations', icon: TrendingUp },
              { id: 'insights', label: 'AI Insights', icon: Zap },
              { id: 'privacy', label: 'Privacy', icon: Shield }
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[#1a237e] text-white'
                      : 'text-white hover:bg-[#1a237e]/40'
                  }`}
                >
                  <IconComponent size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'devices' && (
          <div className="space-y-6">
            {/* Connected Devices */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Connected Devices</h3>
              <div className="space-y-4">
                {Array.isArray(devices) && devices.map((device) => {
                  const StatusIcon = getStatusIcon(device.syncStatus);
                  return (
                    <div key={device.id} className="bg-white/40 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getDeviceIcon(device.deviceType)}</span>
                          <div>
                            <h4 className="font-medium text-gray-800">{device.deviceName}</h4>
                            <p className="text-sm text-gray-600 capitalize">{device.deviceType.replace('_', ' ')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`${getStatusColor(device.syncStatus)} w-5 h-5`} />
                          <span className={`text-sm font-medium ${getStatusColor(device.syncStatus)} capitalize`}>
                            {device.syncStatus}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Last sync: {new Date(device.lastSyncTime).toLocaleString()}
                        </div>
                        <div className="flex gap-2">
                          <span className={`px-2 py-1 rounded text-xs ${device.consentGranted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {device.consentGranted ? 'Authorized' : 'Not Authorized'}
                          </span>
                          <button
                            onClick={() => syncDevice(device.id)}
                            disabled={syncingDevice === device.id || device.syncStatus === 'disconnected'}
                            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                          >
                            {syncingDevice === device.id ? 'Syncing...' : 'Sync Now'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add New Device */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Connect New Device</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { type: 'apple_watch', name: 'Apple Watch', icon: '⌚' },
                  { type: 'fitbit', name: 'Fitbit', icon: '📱' },
                  { type: 'garmin', name: 'Garmin', icon: '🏃' },
                  { type: 'samsung_health', name: 'Samsung Health', icon: '📲' },
                  { type: 'polar', name: 'Polar', icon: '❤️' }
                ].map((deviceType) => (
                  <button
                    key={deviceType.type}
                    onClick={() => connectDevice(deviceType.type)}
                    className="p-4 bg-white/40 rounded-lg hover:bg-white/60 transition-colors text-center"
                  >
                    <div className="text-2xl mb-2">{deviceType.icon}</div>
                    <div className="text-sm font-medium text-gray-800">{deviceType.name}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.isArray(healthMetrics) && healthMetrics.map((metric) => {
                const IconComponent = getMetricIcon(metric.metricType);
                return (
                  <div key={metric.id} className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <IconComponent className="text-green-600" size={24} />
                        <h3 className="font-semibold text-gray-800 capitalize">{metric.metricType.replace('_', ' ')}</h3>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        metric.dataQuality === 'excellent' ? 'bg-green-100 text-green-800' :
                        metric.dataQuality === 'good' ? 'bg-blue-100 text-blue-800' :
                        metric.dataQuality === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {metric.dataQuality}
                      </span>
                    </div>

                    <div className="text-center mb-4">
                      <div className="text-2xl font-bold text-gray-800">{metric.metricValue}</div>
                      <div className="text-sm text-gray-600">{metric.unit}</div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">
                        Recorded: {new Date(metric.recordedAt).toLocaleString()}
                      </div>
                      {metric.contextTags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {metric.contextTags.map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {tag.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Additional tabs with proper array safety would continue here... */}
        
      </div>
    </div>
  );
};

export default HealthIntegration;