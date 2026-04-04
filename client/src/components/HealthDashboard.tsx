import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Heart, 
  Activity, 
  Moon, 
  Watch, 
  TrendingUp, 
  BarChart3, 
  Plus, 
  RefreshCw,
  Trash2
} from 'lucide-react';

interface WearableDevice {
  id: number;
  deviceType: string;
  deviceName: string;
  deviceId: string;
  isActive: boolean;
  lastSyncAt: string | null;
  syncSettings: any;
  createdAt: string;
}

interface HealthMetric {
  id: number;
  metricType: string;
  value: number;
  unit: string;
  timestamp: string;
  confidence: number;
  metadata: any;
}

interface HealthCorrelation {
  id: number;
  emotionalMetric: string;
  physicalMetric: string;
  correlationScore: number;
  confidence: number;
  timeframe: string;
  insights: string[];
  recommendations: string[];
  analysisDate: string;
}

export default function HealthDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const queryClient = useQueryClient();

  const { data: devices } = useQuery<WearableDevice[]>({
    queryKey: ['/api/wearable-devices/1'],
    queryFn: () => fetch('/api/wearable-devices/1').then(res => res.json()),
  });

  const { data: healthMetrics } = useQuery<HealthMetric[]>({
    queryKey: ['/api/health-metrics/1'],
    queryFn: () => fetch('/api/health-metrics/1').then(res => res.json()),
  });

  const { data: correlations } = useQuery<HealthCorrelation[]>({
    queryKey: ['/api/health-correlations/1'],
    queryFn: () => fetch('/api/health-correlations/1').then(res => res.json()),
  });

  const renderOverviewTab = () => {
    return (
      <div className="space-y-6">
        {/* Health Metrics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80">Heart Rate</p>
                <p className="text-2xl font-bold text-white">72</p>
                <p className="text-xs text-white/60">bpm</p>
              </div>
              <div className="p-3 rounded-full bg-white/20">
                <Heart className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80">Steps</p>
                <p className="text-2xl font-bold text-white">8,542</p>
                <p className="text-xs text-white/60">today</p>
              </div>
              <div className="p-3 rounded-full bg-white/20">
                <Activity className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80">Sleep</p>
                <p className="text-2xl font-bold text-white">7.5</p>
                <p className="text-xs text-white/60">hours</p>
              </div>
              <div className="p-3 rounded-full bg-white/20">
                <Moon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80">Stress Level</p>
                <p className="text-2xl font-bold text-white">3</p>
                <p className="text-xs text-white/60">out of 10</p>
              </div>
              <div className="p-3 rounded-full bg-white/20">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Device Status */}
        <div className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
          <h3 className="text-lg font-semibold text-white mb-4">Connected Devices</h3>
          <div className="space-y-3">
            {devices?.map((device) => (
              <div key={device.id} className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-full bg-white/20">
                    <Watch className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{device.deviceName}</p>
                    <p className="text-sm text-white/60 capitalize">{device.deviceType}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${device.isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <span className="text-sm text-white/80">{device.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            )) || <p className="text-white/60">No devices connected</p>}
          </div>
        </div>

        {/* Recent Correlations */}
        <div className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
          <h3 className="text-lg font-semibold text-white mb-4">Health Insights</h3>
          <div className="space-y-3">
            {correlations?.slice(0, 3).map((correlation) => (
              <div key={correlation.id} className="p-4 bg-white/10 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium">
                    {correlation.emotionalMetric} & {correlation.physicalMetric}
                  </h4>
                  <span className="text-sm text-white/60">
                    {Math.round(correlation.correlationScore * 100)}% correlation
                  </span>
                </div>
                <div className="space-y-1">
                  {correlation.insights?.map((insight, index) => (
                    <p key={index} className="text-white/80 text-sm">â€¢ {insight}</p>
                  )) || <p className="text-white/60">No insights available</p>}
                </div>
              </div>
            )) || <p className="text-white/60">No correlations found</p>}
          </div>
        </div>
      </div>
    );
  };

  const renderDevicesTab = () => {
    return (
      <div className="space-y-6">
        {/* Add Device Button */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">Wearable Devices</h3>
          <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add Device</span>
          </button>
        </div>

        {/* Device List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {devices?.map((device) => (
            <div key={device.id} className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-white font-semibold">{device.deviceName}</h4>
                  <p className="text-white/60 text-sm capitalize">{device.deviceType}</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${device.isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-white/80">Device ID:</span>
                  <span className="text-white">{device.deviceId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/80">Last Sync:</span>
                  <span className="text-white">
                    {device.lastSyncAt ? new Date(device.lastSyncAt).toLocaleDateString() : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/80">Status:</span>
                  <span className="text-white">{device.isActive ? 'Connected' : 'Disconnected'}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button className="flex-1 bg-white/20 hover:bg-white/30 text-white py-2 px-3 rounded text-sm flex items-center justify-center space-x-1">
                  <RefreshCw className="w-3 h-3" />
                  <span>Sync</span>
                </button>
                <button className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-white py-2 px-3 rounded text-sm flex items-center justify-center space-x-1">
                  <Trash2 className="w-3 h-3" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          )) || (
            <div className="col-span-2 text-center py-8 text-white/60">
              <Watch className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No devices connected</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCorrelationsTab = () => {
    return (
      <div className="space-y-6">
        {/* Correlation Analysis */}
        <div className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
          <h3 className="text-lg font-semibold text-white mb-4">Health & Wellness Correlations</h3>
          <div className="space-y-4">
            {correlations?.map((correlation) => (
              <div key={correlation.id} className="p-4 bg-white/10 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-medium">
                    {correlation.emotionalMetric} â†” {correlation.physicalMetric}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-white/60 text-sm">Correlation:</span>
                    <span className="text-white font-bold">{Math.round(correlation.correlationScore * 100)}%</span>
                  </div>
                </div>
                
                <div className="space-y-2 mb-3">
                  <p className="text-white/80 text-sm font-medium">Insights:</p>
                  {correlation.insights?.map((insight, index) => (
                    <p key={index} className="text-white/70 text-sm ml-2">â€¢ {insight}</p>
                  )) || <p className="text-white/60 text-sm">No insights available</p>}
                </div>

                <div className="space-y-2">
                  <p className="text-white/80 text-sm font-medium">Recommendations:</p>
                  {correlation.recommendations?.map((rec, index) => (
                    <p key={index} className="text-white/70 text-sm ml-2">â€¢ {rec}</p>
                  )) || <p className="text-white/60 text-sm">No recommendations available</p>}
                </div>

                <div className="flex items-center justify-between mt-3 text-xs text-white/60">
                  <span>Timeframe: {correlation.timeframe}</span>
                  <span>Confidence: {Math.round(correlation.confidence * 100)}%</span>
                  <span>Analyzed: {new Date(correlation.analysisDate).toLocaleDateString()}</span>
                </div>
              </div>
            )) || <p className="text-white/60">No correlation data available</p>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen theme-primary p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Health Dashboard</h1>
          <p className="text-white/80">Track your physical health and wellness correlations</p>
        </div>

        {/* Navigation Tabs */}
        <div className="theme-card rounded-xl p-1 mb-6 border border-silver hover:border-2 hover:animate-shimmer">
          <div className="flex space-x-1">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'devices', label: 'Devices', icon: Watch },
              { id: 'correlations', label: 'Correlations', icon: TrendingUp },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'theme-primary text-white shadow-sm'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'devices' && renderDevicesTab()}
        {activeTab === 'correlations' && renderCorrelationsTab()}
      </div>
    </div>
  );
}
