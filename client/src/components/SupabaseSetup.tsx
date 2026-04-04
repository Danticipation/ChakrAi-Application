import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, ExternalLink, Check, AlertCircle, Database, Users, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function SupabaseSetup() {
  const [credentials, setCredentials] = useState({
    supabaseUrl: '',
    supabaseAnonKey: '',
    supabaseServiceKey: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!credentials.supabaseUrl || !credentials.supabaseAnonKey || !credentials.supabaseServiceKey) {
      toast({
        title: 'Missing Credentials',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/admin/configure-supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });

      if (response.ok) {
        setIsConfigured(true);
        toast({
          title: 'Configuration Successful',
          description: 'Supabase community features are now active. Restart the application to apply changes.',
          variant: 'default'
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Configuration Failed',
          description: error.message || 'Failed to configure Supabase',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Configuration Error',
        description: 'Network error. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      toast({
        title: 'Copied to clipboard',
        description: `${field} copied successfully`,
      });
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Unable to copy to clipboard',
        variant: 'destructive'
      });
    }
  };

  const setupSteps = [
    {
      step: 1,
      title: 'Create Supabase Project',
      description: 'Go to supabase.com/dashboard and create a new project',
      icon: <Database className="h-5 w-5" />
    },
    {
      step: 2,
      title: 'Get API Credentials',
      description: 'Navigate to Settings > API to find your project URL and keys',
      icon: <Shield className="h-5 w-5" />
    },
    {
      step: 3,
      title: 'Run Database Schema',
      description: 'Execute the provided SQL schema in Supabase SQL Editor',
      icon: <Database className="h-5 w-5" />
    },
    {
      step: 4,
      title: 'Configure Application',
      description: 'Enter your credentials below to activate community features',
      icon: <Users className="h-5 w-5" />
    }
  ];

  const sqlSchema = `-- Supabase Community Schema
-- Copy this SQL and run it in your Supabase SQL Editor

-- Enable Row Level Security
CREATE TABLE IF NOT EXISTS forums (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  is_moderated BOOLEAN DEFAULT true,
  anonymous_posts_allowed BOOLEAN DEFAULT true,
  member_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Continue with remaining tables...
-- (Full schema available in supabase-schema.sql file)`;

  if (isConfigured) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <Check className="h-5 w-5" />
            Supabase Configuration Complete
          </CardTitle>
          <CardDescription>
            Community features are now active. Please restart the application to begin using:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">Anonymous Forums</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Crisis Detection</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium">Peer Check-ins</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
              <Database className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-medium">Real-time Updates</span>
            </div>
          </div>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Restart the application for changes to take effect. Community features will then be available in the Community section.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6 text-blue-600" />
            Supabase Community Setup
          </CardTitle>
          <CardDescription>
            Configure Supabase to enable anonymous forums, peer support, and real-time community features
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="setup" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup">Setup Guide</TabsTrigger>
          <TabsTrigger value="credentials">Enter Credentials</TabsTrigger>
          <TabsTrigger value="schema">Database Schema</TabsTrigger>
        </TabsList>

        <TabsContent value="setup">
          <Card>
            <CardHeader>
              <CardTitle>Setup Instructions</CardTitle>
              <CardDescription>
                Follow these steps to configure Supabase for community features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {setupSteps.map((step) => (
                  <div key={step.step} className="flex gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                        <span className="text-sm font-medium text-blue-600">{step.step}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {step.icon}
                        <h3 className="font-medium">{step.title}</h3>
                      </div>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <ExternalLink className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Supabase Dashboard</h4>
                    <p className="text-sm text-blue-700 mb-2">
                      Create your free Supabase project and get your API credentials
                    </p>
                    <Button 
                      size="sm" 
                      onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Open Supabase Dashboard
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credentials">
          <Card>
            <CardHeader>
              <CardTitle>Enter Supabase Credentials</CardTitle>
              <CardDescription>
                Input your Supabase project credentials to activate community features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="supabaseUrl">Supabase Project URL</Label>
                  <Input
                    id="supabaseUrl"
                    placeholder="https://your-project.supabase.co"
                    value={credentials.supabaseUrl}
                    onChange={(e) => handleInputChange('supabaseUrl', e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Found in Settings â†’ API â†’ Project URL
                  </p>
                </div>

                <div>
                  <Label htmlFor="supabaseAnonKey">Supabase Anon Key</Label>
                  <Input
                    id="supabaseAnonKey"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={credentials.supabaseAnonKey}
                    onChange={(e) => handleInputChange('supabaseAnonKey', e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Found in Settings â†’ API â†’ Project API keys â†’ anon public
                  </p>
                </div>

                <div>
                  <Label htmlFor="supabaseServiceKey">Supabase Service Role Key</Label>
                  <Input
                    id="supabaseServiceKey"
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={credentials.supabaseServiceKey}
                    onChange={(e) => handleInputChange('supabaseServiceKey', e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Found in Settings â†’ API â†’ Project API keys â†’ service_role secret
                  </p>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  These credentials will be securely stored as environment variables. The service role key is kept private on the server.
                </AlertDescription>
              </Alert>

              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? 'Configuring...' : 'Configure Supabase'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schema">
          <Card>
            <CardHeader>
              <CardTitle>Database Schema</CardTitle>
              <CardDescription>
                Run this SQL in your Supabase SQL Editor to create the community tables
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto max-h-96">
                    <code>{sqlSchema}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(sqlSchema, 'SQL Schema')}
                  >
                    {copiedField === 'SQL Schema' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    The complete SQL schema is available in the <code>supabase-schema.sql</code> file in your project root. 
                    Copy and run the entire contents in your Supabase SQL Editor.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900">Tables Created</h4>
                    <ul className="text-sm text-green-700 mt-1 space-y-1">
                      <li>â€¢ forums</li>
                      <li>â€¢ forum_posts</li>
                      <li>â€¢ forum_replies</li>
                      <li>â€¢ peer_checkins</li>
                      <li>â€¢ content_moderation</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900">Security Features</h4>
                    <ul className="text-sm text-blue-700 mt-1 space-y-1">
                      <li>â€¢ Row Level Security (RLS)</li>
                      <li>â€¢ Anonymous user protection</li>
                      <li>â€¢ Content flagging policies</li>
                      <li>â€¢ Crisis detection ready</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SupabaseSetup;
