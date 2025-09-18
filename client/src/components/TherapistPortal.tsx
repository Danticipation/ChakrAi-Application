import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, FileText, UserCheck, Calendar, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';

interface Client {
  id: number;
  clientUserId: number;
  status: string;
  activatedAt?: string;
  privacySettings?: any;
}

interface RiskAlert {
  id: number;
  clientUserId: number;
  alertType: string;
  severity: string;
  description: string;
  acknowledged: boolean;
  createdAt: string;
}

interface SessionNote {
  id: number;
  clientUserId: number;
  sessionDate: string;
  notes: string;
  riskAssessment: string;
}

interface ClientDashboardData {
  clientId: number;
  privacySettings: any;
  allowedData: {
    moodData?: any[];
    journalData?: any[];
    riskAlerts?: any[];
    sessionNotes?: any[];
  };
}

const TherapistPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [sessionNotes, setSessionNotes] = useState<SessionNote[]>([]);
  const [clientDashboard, setClientDashboard] = useState<ClientDashboardData | null>(null);
  const [loading, setLoading] = useState(false);

  // Mock therapist ID - in real app this would come from authentication
  const therapistId = 1;

  useEffect(() => {
    loadTherapistData();
  }, []);

  const loadTherapistData = async () => {
    try {
      setLoading(true);
      
      // Load clients
      const clientsResponse = await fetch(`/api/therapist/${therapistId}/clients`);
      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json();
        setClients(clientsData);
      }

      // Load risk alerts
      const alertsResponse = await fetch(`/api/therapist/${therapistId}/alerts`);
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setRiskAlerts(alertsData);
      }

      // Load session notes
      const notesResponse = await fetch(`/api/therapist/${therapistId}/session-notes`);
      if (notesResponse.ok) {
        const notesData = await notesResponse.json();
        setSessionNotes(notesData);
      }

    } catch (error) {
      console.error('Failed to load therapist data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClientDashboard = async (clientUserId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/therapist/${therapistId}/client/${clientUserId}/dashboard`);
      if (response.ok) {
        const data = await response.json();
        setClientDashboard(data);
        setSelectedClient(clientUserId);
      }
    } catch (error) {
      console.error('Failed to load client dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: number) => {
    try {
      const response = await fetch(`/api/therapist/alert/${alertId}/acknowledge`, {
        method: 'PATCH'
      });
      if (response.ok) {
        setRiskAlerts(prev => 
          prev.map(alert => 
            alert.id === alertId ? { ...alert, acknowledged: true } : alert
          )
        );
      }
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const generateRiskAlerts = async (clientUserId: number) => {
    try {
      const response = await fetch(`/api/client/${clientUserId}/generate-risk-alerts`, {
        method: 'POST'
      });
      if (response.ok) {
        loadTherapistData(); // Reload to show new alerts
      }
    } catch (error) {
      console.error('Failed to generate risk alerts:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-amber-600';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{clients.filter(c => c.status === 'active').length}</div>
            <p className="text-xs text-white/70">
              {clients.filter(c => c.status === 'pending').length} pending invitations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Unread Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{riskAlerts.filter(a => !a.acknowledged).length}</div>
            <p className="text-xs text-white/70">
              {riskAlerts.filter(a => a.severity === 'high' || a.severity === 'critical').length} high priority
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">This Week's Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{sessionNotes.length}</div>
            <p className="text-xs text-white/70">
              {sessionNotes.filter(n => n.riskAssessment === 'high').length} requiring follow-up
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-white">Recent Risk Alerts</CardTitle>
          <CardDescription className="text-white/70">Latest client risk indicators requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {riskAlerts.slice(0, 5).map(alert => (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-[var(--theme-secondary)] rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge className={`${getSeverityColor(alert.severity)} text-white`}>
                    {alert.severity}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium text-white">{alert.description}</p>
                    <p className="text-xs text-white/70">Client {alert.clientUserId} â€¢ {formatDate(alert.createdAt)}</p>
                  </div>
                </div>
                {!alert.acknowledged && (
                  <Button 
                    size="sm" 
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Acknowledge
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderClientDashboards = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.filter(c => c.status === 'active').map(client => (
          <Card key={client.id} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                Client {client.clientUserId}
                <UserCheck className="h-4 w-4 text-green-400" />
              </CardTitle>
              <CardDescription className="text-white/70">
                Active since {client.activatedAt ? formatDate(client.activatedAt) : 'Unknown'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button 
                  onClick={() => loadClientDashboard(client.clientUserId)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  View Dashboard
                </Button>
                <Button 
                  onClick={() => generateRiskAlerts(client.clientUserId)}
                  variant="outline"
                  size="sm"
                  className="w-full border-white/20 text-white hover:bg-white/10"
                >
                  Generate Risk Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {clientDashboard && selectedClient && (
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Client {selectedClient} Dashboard</CardTitle>
            <CardDescription className="text-white/70">Comprehensive view of client progress and data</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="mood" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="mood">Mood Data</TabsTrigger>
                <TabsTrigger value="journal">Journal Entries</TabsTrigger>
                <TabsTrigger value="alerts">Risk Alerts</TabsTrigger>
                <TabsTrigger value="privacy">Privacy Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="mood" className="space-y-4">
                {clientDashboard.allowedData.moodData ? (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-white">Recent Mood Entries</h4>
                    {clientDashboard.allowedData.moodData.slice(0, 10).map((mood: any, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-[var(--theme-secondary)] rounded">
                        <span className="text-white">{mood.mood}</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={(mood.intensity || 5) * 10} className="w-20" />
                          <span className="text-xs text-white/70">{mood.intensity}/10</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/70">Mood data sharing disabled by client</p>
                )}
              </TabsContent>
              
              <TabsContent value="journal" className="space-y-4">
                {clientDashboard.allowedData.journalData ? (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-white">Recent Journal Entries</h4>
                    {clientDashboard.allowedData.journalData.slice(0, 5).map((entry: any, idx) => (
                      <div key={idx} className="p-3 bg-[var(--theme-secondary)] rounded">
                        <p className="text-white text-sm">{entry.content.substring(0, 200)}...</p>
                        <p className="text-xs text-white/70 mt-1">{formatDate(entry.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/70">Journal data sharing disabled by client</p>
                )}
              </TabsContent>
              
              <TabsContent value="alerts" className="space-y-4">
                {clientDashboard.allowedData.riskAlerts ? (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-white">Risk Alerts</h4>
                    {clientDashboard.allowedData.riskAlerts.map((alert: any, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-[var(--theme-secondary)] rounded">
                        <div>
                          <Badge className={`${getSeverityColor(alert.severity)} text-white mb-1`}>
                            {alert.severity}
                          </Badge>
                          <p className="text-white text-sm">{alert.description}</p>
                        </div>
                        <span className="text-xs text-white/70">{formatDate(alert.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/70">Risk alert sharing disabled by client</p>
                )}
              </TabsContent>
              
              <TabsContent value="privacy" className="space-y-4">
                <h4 className="text-sm font-medium text-white">Client Privacy Preferences</h4>
                <div className="space-y-3">
                  {clientDashboard.privacySettings ? (
                    <>
                      <div className="flex items-center justify-between p-2 bg-[var(--theme-secondary)] rounded">
                        <span className="text-white">Share Journal Data</span>
                        <Switch checked={clientDashboard.privacySettings.shareJournalData} disabled />
                      </div>
                      <div className="flex items-center justify-between p-2 bg-[var(--theme-secondary)] rounded">
                        <span className="text-white">Share Mood Data</span>
                        <Switch checked={clientDashboard.privacySettings.shareMoodData} disabled />
                      </div>
                      <div className="flex items-center justify-between p-2 bg-[var(--theme-secondary)] rounded">
                        <span className="text-white">Share Crisis Alerts</span>
                        <Switch checked={clientDashboard.privacySettings.shareCrisisAlerts} disabled />
                      </div>
                      <div className="flex items-center justify-between p-2 bg-[var(--theme-secondary)] rounded">
                        <span className="text-white">Blur Crisis Flags</span>
                        <Switch checked={clientDashboard.privacySettings.blurCrisisFlags} disabled />
                      </div>
                    </>
                  ) : (
                    <p className="text-white/70">Default privacy settings applied</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderSessionNotes = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-white">Session Notes</CardTitle>
          <CardDescription className="text-white/70">Recorded therapeutic sessions and notes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessionNotes.map(note => (
              <div key={note.id} className="p-4 bg-[var(--theme-secondary)] rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium">Client {note.clientUserId}</h4>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      className={`${
                        note.riskAssessment === 'high' ? 'bg-red-500' :
                        note.riskAssessment === 'medium' ? 'bg-yellow-500' :
                        'bg-green-500'
                      } text-white`}
                    >
                      {note.riskAssessment} risk
                    </Badge>
                    <span className="text-xs text-white/70">{formatDate(note.sessionDate)}</span>
                  </div>
                </div>
                <p className="text-white/90 text-sm">{note.notes}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen theme-primary">
        <div className="text-white">Loading therapist portal...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-primary p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Therapist Portal</h1>
          <p className="text-white/70">Secure access to client dashboards and therapeutic insights</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Client Dashboards</span>
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Session Notes</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {renderOverview()}
          </TabsContent>

          <TabsContent value="clients">
            {renderClientDashboards()}
          </TabsContent>

          <TabsContent value="sessions">
            {renderSessionNotes()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TherapistPortal;
