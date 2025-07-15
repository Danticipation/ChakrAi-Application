import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Ear, 
  Hand, 
  Brain, 
  Volume2, 
  Type, 
  Palette, 
  Navigation,
  Languages,
  Settings,
  CheckCircle,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

interface AccessibilitySettings {
  visualImpairment: {
    enabled: boolean;
    screenReaderSupport: boolean;
    highContrast: boolean;
    fontSize: 'small' | 'medium' | 'large' | 'extra-large';
    colorBlindnessType: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
    voiceDescriptions: boolean;
    hapticFeedback: boolean;
  };
  hearingImpairment: {
    enabled: boolean;
    closedCaptions: boolean;
    visualAlerts: boolean;
    signLanguageSupport: boolean;
    transcriptionEnabled: boolean;
    vibrationAlerts: boolean;
  };
  motorImpairment: {
    enabled: boolean;
    voiceNavigation: boolean;
    eyeTracking: boolean;
    switchControl: boolean;
    dwellTime: number;
    largerTouchTargets: boolean;
    oneHandedMode: boolean;
  };
  cognitiveSupport: {
    enabled: boolean;
    simplifiedInterface: boolean;
    reducedAnimations: boolean;
    clearLanguage: boolean;
    memoryAids: boolean;
    focusAssistance: boolean;
    timeoutExtensions: boolean;
  };
  language: string;
  speechRate: number;
  preferredInteractionMode: 'voice' | 'text' | 'gesture' | 'mixed';
}

interface AccessibilitySettingsProps {
  userId: number;
  onSettingsChange?: (settings: AccessibilitySettings) => void;
}

export function AccessibilitySettings({ userId, onSettingsChange }: AccessibilitySettingsProps) {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    visualImpairment: {
      enabled: false,
      screenReaderSupport: false,
      highContrast: false,
      fontSize: 'medium',
      colorBlindnessType: 'none',
      voiceDescriptions: false,
      hapticFeedback: false,
    },
    hearingImpairment: {
      enabled: false,
      closedCaptions: false,
      visualAlerts: false,
      signLanguageSupport: false,
      transcriptionEnabled: false,
      vibrationAlerts: false,
    },
    motorImpairment: {
      enabled: false,
      voiceNavigation: false,
      eyeTracking: false,
      switchControl: false,
      dwellTime: 1000,
      largerTouchTargets: false,
      oneHandedMode: false,
    },
    cognitiveSupport: {
      enabled: false,
      simplifiedInterface: false,
      reducedAnimations: false,
      clearLanguage: false,
      memoryAids: false,
      focusAssistance: false,
      timeoutExtensions: false,
    },
    language: 'en',
    speechRate: 1.0,
    preferredInteractionMode: 'mixed',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingVoice, setTestingVoice] = useState(false);

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano' },
    { code: 'zh', name: 'Chinese', nativeName: '中文' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語' },
    { code: 'ko', name: 'Korean', nativeName: '한국어' },
  ];

  useEffect(() => {
    fetchAccessibilitySettings();
  }, [userId]);

  const fetchAccessibilitySettings = async () => {
    try {
      const response = await fetch(`/api/accessibility/settings/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Failed to fetch accessibility settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/accessibility/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, settings })
      });

      if (response.ok) {
        onSettingsChange?.(settings);
        
        // Apply settings immediately
        applyAccessibilitySettings(settings);
      }
    } catch (error) {
      console.error('Failed to save accessibility settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const applyAccessibilitySettings = (newSettings: AccessibilitySettings) => {
    // Apply font size
    document.documentElement.style.setProperty(
      '--accessibility-font-size',
      getFontSizeValue(newSettings.visualImpairment.fontSize)
    );

    // Apply high contrast
    if (newSettings.visualImpairment.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    // Apply reduced animations
    if (newSettings.cognitiveSupport.reducedAnimations) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }

    // Apply larger touch targets
    if (newSettings.motorImpairment.largerTouchTargets) {
      document.documentElement.classList.add('large-touch-targets');
    } else {
      document.documentElement.classList.remove('large-touch-targets');
    }

    // Set language
    document.documentElement.lang = newSettings.language;
  };

  const getFontSizeValue = (size: string) => {
    const sizes = {
      small: '14px',
      medium: '16px',
      large: '18px',
      'extra-large': '22px'
    };
    return sizes[size as keyof typeof sizes] || '16px';
  };

  const testVoiceSettings = async () => {
    try {
      setTestingVoice(true);
      const testMessage = "This is a test of your voice settings for accessibility.";
      
      const response = await fetch('/api/accessibility/test-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testMessage,
          language: settings.language,
          speechRate: settings.speechRate
        })
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
      }
    } catch (error) {
      console.error('Failed to test voice settings:', error);
    } finally {
      setTestingVoice(false);
    }
  };

  const updateSetting = (category: keyof AccessibilitySettings, key: string, value: any) => {
    setSettings(prev => {
      const currentValue = prev[category];
      
      // Handle primitive values (language, speechRate, preferredInteractionMode)
      if (typeof currentValue !== 'object' || currentValue === null) {
        return {
          ...prev,
          [category]: value
        };
      }
      
      // Handle object values (visualImpairment, hearingImpairment, etc.)
      return {
        ...prev,
        [category]: {
          ...currentValue,
          [key]: value
        }
      };
    });
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Accessibility Settings</h1>
        <p className="text-gray-600">Customize TraI for your individual needs and preferences</p>
      </div>

      {/* Language & Speech Settings */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-800">
            <Languages className="w-5 h-5 mr-2" />
            Language & Speech
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Language</label>
              <Select
                value={settings.language}
                onValueChange={(value) => setSettings(prev => ({ ...prev, language: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(lang => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.nativeName} ({lang.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Speech Rate: {settings.speechRate.toFixed(1)}x
              </label>
              <Slider
                value={[settings.speechRate]}
                onValueChange={([value]) => setSettings(prev => ({ ...prev, speechRate: value }))}
                min={0.5}
                max={2.0}
                step={0.1}
                className="mt-2"
              />
            </div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={testVoiceSettings}
            disabled={testingVoice}
            className="w-full"
          >
            <Volume2 className="w-4 h-4 mr-2" />
            {testingVoice ? 'Testing...' : 'Test Voice Settings'}
          </Button>
        </CardContent>
      </Card>

      {/* Visual Accessibility */}
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center text-purple-800">
            <Eye className="w-5 h-5 mr-2" />
            Visual Accessibility
            {settings.visualImpairment.enabled && (
              <Badge variant="secondary" className="ml-2">Active</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Enable Visual Accessibility</span>
            <Switch
              checked={settings.visualImpairment.enabled}
              onCheckedChange={(checked) => updateSetting('visualImpairment', 'enabled', checked)}
            />
          </div>
          
          {settings.visualImpairment.enabled && (
            <div className="space-y-4 pl-4 border-l-2 border-purple-200">
              <div className="flex items-center justify-between">
                <span className="text-sm">Screen Reader Support</span>
                <Switch
                  checked={settings.visualImpairment.screenReaderSupport}
                  onCheckedChange={(checked) => updateSetting('visualImpairment', 'screenReaderSupport', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">High Contrast Mode</span>
                <Switch
                  checked={settings.visualImpairment.highContrast}
                  onCheckedChange={(checked) => updateSetting('visualImpairment', 'highContrast', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Voice Descriptions</span>
                <Switch
                  checked={settings.visualImpairment.voiceDescriptions}
                  onCheckedChange={(checked) => updateSetting('visualImpairment', 'voiceDescriptions', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Haptic Feedback</span>
                <Switch
                  checked={settings.visualImpairment.hapticFeedback}
                  onCheckedChange={(checked) => updateSetting('visualImpairment', 'hapticFeedback', checked)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Font Size</label>
                <Select
                  value={settings.visualImpairment.fontSize}
                  onValueChange={(value) => updateSetting('visualImpairment', 'fontSize', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                    <SelectItem value="extra-large">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Color Vision Type</label>
                <Select
                  value={settings.visualImpairment.colorBlindnessType}
                  onValueChange={(value) => updateSetting('visualImpairment', 'colorBlindnessType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Normal Color Vision</SelectItem>
                    <SelectItem value="protanopia">Protanopia (Red-blind)</SelectItem>
                    <SelectItem value="deuteranopia">Deuteranopia (Green-blind)</SelectItem>
                    <SelectItem value="tritanopia">Tritanopia (Blue-blind)</SelectItem>
                    <SelectItem value="achromatopsia">Achromatopsia (No color)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hearing Accessibility */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center text-green-800">
            <Ear className="w-5 h-5 mr-2" />
            Hearing Accessibility
            {settings.hearingImpairment.enabled && (
              <Badge variant="secondary" className="ml-2">Active</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Enable Hearing Accessibility</span>
            <Switch
              checked={settings.hearingImpairment.enabled}
              onCheckedChange={(checked) => updateSetting('hearingImpairment', 'enabled', checked)}
            />
          </div>
          
          {settings.hearingImpairment.enabled && (
            <div className="space-y-4 pl-4 border-l-2 border-green-200">
              <div className="flex items-center justify-between">
                <span className="text-sm">Closed Captions</span>
                <Switch
                  checked={settings.hearingImpairment.closedCaptions}
                  onCheckedChange={(checked) => updateSetting('hearingImpairment', 'closedCaptions', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Visual Alerts</span>
                <Switch
                  checked={settings.hearingImpairment.visualAlerts}
                  onCheckedChange={(checked) => updateSetting('hearingImpairment', 'visualAlerts', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Speech Transcription</span>
                <Switch
                  checked={settings.hearingImpairment.transcriptionEnabled}
                  onCheckedChange={(checked) => updateSetting('hearingImpairment', 'transcriptionEnabled', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Vibration Alerts</span>
                <Switch
                  checked={settings.hearingImpairment.vibrationAlerts}
                  onCheckedChange={(checked) => updateSetting('hearingImpairment', 'vibrationAlerts', checked)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Motor Accessibility */}
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center text-orange-800">
            <Hand className="w-5 h-5 mr-2" />
            Motor Accessibility
            {settings.motorImpairment.enabled && (
              <Badge variant="secondary" className="ml-2">Active</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Enable Motor Accessibility</span>
            <Switch
              checked={settings.motorImpairment.enabled}
              onCheckedChange={(checked) => updateSetting('motorImpairment', 'enabled', checked)}
            />
          </div>
          
          {settings.motorImpairment.enabled && (
            <div className="space-y-4 pl-4 border-l-2 border-orange-200">
              <div className="flex items-center justify-between">
                <span className="text-sm">Voice Navigation</span>
                <Switch
                  checked={settings.motorImpairment.voiceNavigation}
                  onCheckedChange={(checked) => updateSetting('motorImpairment', 'voiceNavigation', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Larger Touch Targets</span>
                <Switch
                  checked={settings.motorImpairment.largerTouchTargets}
                  onCheckedChange={(checked) => updateSetting('motorImpairment', 'largerTouchTargets', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">One-Handed Mode</span>
                <Switch
                  checked={settings.motorImpairment.oneHandedMode}
                  onCheckedChange={(checked) => updateSetting('motorImpairment', 'oneHandedMode', checked)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Dwell Time: {settings.motorImpairment.dwellTime}ms
                </label>
                <Slider
                  value={[settings.motorImpairment.dwellTime]}
                  onValueChange={([value]) => updateSetting('motorImpairment', 'dwellTime', value)}
                  min={500}
                  max={3000}
                  step={100}
                  className="mt-2"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cognitive Support */}
      <Card className="border-pink-200">
        <CardHeader>
          <CardTitle className="flex items-center text-pink-800">
            <Brain className="w-5 h-5 mr-2" />
            Cognitive Support
            {settings.cognitiveSupport.enabled && (
              <Badge variant="secondary" className="ml-2">Active</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Enable Cognitive Support</span>
            <Switch
              checked={settings.cognitiveSupport.enabled}
              onCheckedChange={(checked) => updateSetting('cognitiveSupport', 'enabled', checked)}
            />
          </div>
          
          {settings.cognitiveSupport.enabled && (
            <div className="space-y-4 pl-4 border-l-2 border-pink-200">
              <div className="flex items-center justify-between">
                <span className="text-sm">Simplified Interface</span>
                <Switch
                  checked={settings.cognitiveSupport.simplifiedInterface}
                  onCheckedChange={(checked) => updateSetting('cognitiveSupport', 'simplifiedInterface', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Reduced Animations</span>
                <Switch
                  checked={settings.cognitiveSupport.reducedAnimations}
                  onCheckedChange={(checked) => updateSetting('cognitiveSupport', 'reducedAnimations', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Clear Language</span>
                <Switch
                  checked={settings.cognitiveSupport.clearLanguage}
                  onCheckedChange={(checked) => updateSetting('cognitiveSupport', 'clearLanguage', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Memory Aids</span>
                <Switch
                  checked={settings.cognitiveSupport.memoryAids}
                  onCheckedChange={(checked) => updateSetting('cognitiveSupport', 'memoryAids', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Focus Assistance</span>
                <Switch
                  checked={settings.cognitiveSupport.focusAssistance}
                  onCheckedChange={(checked) => updateSetting('cognitiveSupport', 'focusAssistance', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Extended Timeouts</span>
                <Switch
                  checked={settings.cognitiveSupport.timeoutExtensions}
                  onCheckedChange={(checked) => updateSetting('cognitiveSupport', 'timeoutExtensions', checked)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interaction Preferences */}
      <Card className="border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center text-indigo-800">
            <Navigation className="w-5 h-5 mr-2" />
            Interaction Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <label className="text-sm font-medium mb-2 block">Preferred Interaction Mode</label>
            <Select
              value={settings.preferredInteractionMode}
              onValueChange={(value) => setSettings(prev => ({ ...prev, preferredInteractionMode: value as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="voice">Voice Only</SelectItem>
                <SelectItem value="text">Text Only</SelectItem>
                <SelectItem value="gesture">Gesture Only</SelectItem>
                <SelectItem value="mixed">Mixed (Adaptive)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <Button onClick={saveSettings} disabled={saving} className="flex-1">
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
        <Button variant="outline" onClick={fetchAccessibilitySettings} className="flex-1">
          Reset
        </Button>
      </div>

      {/* Accessibility Information */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <HelpCircle className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">Accessibility Information</p>
              <ul className="space-y-1 text-xs">
                <li>• Voice commands are available throughout the app when voice navigation is enabled</li>
                <li>• Screen reader support provides detailed descriptions of interface elements</li>
                <li>• Emergency support can be accessed with triple-tap gesture or "Emergency support" voice command</li>
                <li>• All therapeutic content is available in your selected language</li>
                <li>• These settings sync across your devices for consistent accessibility</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}