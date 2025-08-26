import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Phone, Heart, Clock, X, Users, Shield, KeyboardIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CrisisAnalysis {
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  indicators: string[];
  supportMessage: string;
  immediateActions: string[];
  emergencyContacts: string[];
  confidenceScore: number;
  checkInScheduled: boolean;
}

interface UserProfile {
  id: string;
  location: {
    country: string;
    region?: string;
  };
  preferences: {
    preferredLanguage: string;
    specializedServices?: string[];
  };
}

interface CrisisAlertProps {
  crisisAnalysis: CrisisAnalysis;
  currentUser: UserProfile;
  onClose: () => void;
  onGetHelp: () => void;
}

export default function CrisisAlert({ crisisAnalysis, currentUser, onClose, onGetHelp }: CrisisAlertProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showDismissConfirmation, setShowDismissConfirmation] = useState(false);
  const [actionsTracked, setActionsTracked] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  // Validate crisis analysis data
  const validateCrisisAnalysis = useCallback((analysis: CrisisAnalysis): boolean => {
    if (!analysis) {
      setError('Crisis analysis data is missing. Please contact support immediately.');
      return false;
    }
    
    const validRiskLevels = ['none', 'low', 'medium', 'high', 'critical'];
    if (!validRiskLevels.includes(analysis.riskLevel)) {
      setError('Invalid risk level detected. Please contact support immediately.');
      return false;
    }
    
    if (!analysis.supportMessage || analysis.supportMessage.trim().length === 0) {
      setError('Support message missing. Using fallback resources.');
      return false;
    }
    
    if (analysis.confidenceScore < 0 || analysis.confidenceScore > 1) {
      setError('Risk assessment data may be inaccurate. Please contact support.');
      return false;
    }
    
    return true;
  }, []);

  // Get location-aware emergency contacts
  const getEmergencyContacts = useCallback((userProfile: UserProfile) => {
    const { country, region } = userProfile.location;
    const { preferredLanguage, specializedServices } = userProfile.preferences;
    
    const contacts = [];
    
    // Base emergency contacts by country
    switch (country) {
      case 'US':
        contacts.push('Crisis Lifeline: 988');
        contacts.push('Crisis Text Line: Text HOME to 741741');
        contacts.push('Emergency Services: 911');
        break;
      case 'UK': 
        contacts.push('Samaritans: 116 123');
        contacts.push('Crisis Text Line: Text SHOUT to 85258');
        contacts.push('Emergency Services: 999');
        break;
      case 'CA':
        contacts.push('Talk Suicide Canada: 1-833-456-4566');
        contacts.push('Crisis Text Line: Text TALK to 686868');
        contacts.push('Emergency Services: 911');
        break;
      case 'AU':
        contacts.push('Lifeline: 13 11 14');
        contacts.push('Crisis Text Line: Text CONNECT to 85258');
        contacts.push('Emergency Services: 000');
        break;
      default:
        contacts.push('International Association for Suicide Prevention');
        contacts.push('Crisis Text Line: Available globally');
        contacts.push('Local Emergency Services: Check your area');
    }
    
    // Add specialized services if applicable
    if (specializedServices?.includes('lgbtq')) {
      contacts.push('Trevor Lifeline: 1-866-488-7386');
    }
    if (specializedServices?.includes('veterans')) {
      contacts.push('Veterans Crisis Line: 1-800-273-8255');
    }
    if (specializedServices?.includes('youth')) {
      contacts.push('National Child Abuse Hotline: 1-800-4-A-CHILD');
    }
    
    return contacts;
  }, []);

  // Track crisis actions
  const trackAction = useCallback(async (action: string) => {
    if (!crisisAnalysis) return;
    
    try {
      if (isOnline) {
        await fetch('/api/crisis-actions', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({
            userId: currentUser.id,
            crisisLevel: crisisAnalysis.riskLevel,
            action: action,
            timestamp: new Date().toISOString(),
            confidenceScore: crisisAnalysis.confidenceScore
          })
        });
      } else {
        // Store action locally when offline
        const offlineActions = JSON.parse(localStorage.getItem('offlineCrisisActions') || '[]');
        offlineActions.push({
          userId: currentUser.id,
          crisisLevel: crisisAnalysis.riskLevel,
          action: action,
          timestamp: new Date().toISOString(),
          confidenceScore: crisisAnalysis.confidenceScore
        });
        localStorage.setItem('offlineCrisisActions', JSON.stringify(offlineActions));
      }
      
      setActionsTracked(prev => [...prev, action]);
      
      toast({
        title: "Action Recorded",
        description: `Your action "${action}" has been recorded for follow-up.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to track crisis action:', error);
      // Still show success to user even if tracking fails
      toast({
        title: "Help Accessed",
        description: "Your wellbeing is our priority. Help has been accessed.",
        duration: 3000,
      });
    }
  }, [currentUser.id, crisisAnalysis, isOnline, toast]);

  // Schedule follow-up for high-risk cases
  const scheduleFollowUp = useCallback(async () => {
    if (!crisisAnalysis) return;
    
    try {
      if (isOnline) {
        await fetch('/api/crisis-followup', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({
            userId: currentUser.id,
            riskLevel: crisisAnalysis.riskLevel,
            followUpTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
            alertId: `crisis-${Date.now()}`
          })
        });
      }
    } catch (error) {
      console.error('Failed to schedule follow-up:', error);
    }
  }, [currentUser.id, crisisAnalysis, isOnline]);

  // Handle close with safety confirmation
  const handleClose = useCallback(() => {
    if (crisisAnalysis && (crisisAnalysis.riskLevel === 'critical' || crisisAnalysis.riskLevel === 'high')) {
      setShowDismissConfirmation(true);
    } else {
      onClose();
    }
  }, [crisisAnalysis, onClose]);

  // Get primary emergency number for quick dial
  const getPrimaryEmergencyNumber = useCallback(() => {
    const contacts = getEmergencyContacts(currentUser);
    const primaryContact = contacts?.[0];
    if (primaryContact && primaryContact.includes(':')) {
      const parts = primaryContact.split(': ');
      return parts[1]?.replace(/\s/g, '') || '988';
    }
    return '988'; // Default fallback
  }, [currentUser, getEmergencyContacts]);

  // Keyboard navigation and shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!crisisAnalysis) return;
      
      // Prevent escape on critical alerts
      if (e.key === 'Escape') {
        if (crisisAnalysis.riskLevel !== 'critical') {
          e.preventDefault();
          handleClose();
        }
        return;
      }
      
      // Quick actions via keyboard
      if (e.key === '1') {
        e.preventDefault();
        const emergencyNumber = getPrimaryEmergencyNumber();
        trackAction('called_crisis_line_keyboard');
        window.open(`tel:${emergencyNumber}`, '_self');
      }
      
      if (e.key === '2') {
        e.preventDefault();
        trackAction('requested_professional_help_keyboard');
        onGetHelp();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [crisisAnalysis, handleClose, getPrimaryEmergencyNumber, trackAction, onGetHelp]);

  // Online/offline status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Get risk title helper function
  const getRiskTitle = (level: string) => {
    switch (level) {
      case 'critical':
        return 'Immediate Support Needed';
      case 'high':
        return 'Support Recommended';
      case 'medium':
        return 'Check-in Scheduled';
      default:
        return 'Wellness Check';
    }
  };

  // Screen reader announcement for crisis alerts
  useEffect(() => {
    if (!crisisAnalysis) return;
    
    const announcement = `Crisis alert: ${getRiskTitle(crisisAnalysis.riskLevel)}. ${crisisAnalysis.supportMessage}. Press 1 to call emergency line, Press 2 for professional help.`;
    const ariaLive = document.createElement('div');
    ariaLive.setAttribute('aria-live', 'assertive');
    ariaLive.setAttribute('aria-atomic', 'true');
    ariaLive.className = 'sr-only';
    ariaLive.textContent = announcement;
    document.body.appendChild(ariaLive);
    
    return () => {
      if (document.body.contains(ariaLive)) {
        document.body.removeChild(ariaLive);
      }
    };
  }, [crisisAnalysis]);

  // Auto-schedule follow-up for high-risk cases
  useEffect(() => {
    if (crisisAnalysis && (crisisAnalysis.riskLevel === 'critical' || crisisAnalysis.riskLevel === 'high')) {
      scheduleFollowUp();
    }
  }, [crisisAnalysis, scheduleFollowUp]);

  // Validate data on mount
  useEffect(() => {
    if (crisisAnalysis) {
      validateCrisisAnalysis(crisisAnalysis);
    }
  }, [crisisAnalysis, validateCrisisAnalysis]);

  // Fallback emergency contacts if validation fails or data is missing
  const fallbackContacts = [
    'Crisis Lifeline: 988',
    'Emergency Services: 911', 
    'Crisis Text Line: Text HOME to 741741'
  ];

  // Use safe emergency contacts
  const safeEmergencyContacts = (crisisAnalysis?.emergencyContacts?.length ?? 0) > 0 
    ? crisisAnalysis.emergencyContacts 
    : getEmergencyContacts(currentUser);

  if (!crisisAnalysis || crisisAnalysis.riskLevel === 'none' || crisisAnalysis.riskLevel === 'low') {
    return null;
  }

  // Dismissal Confirmation Modal Component
  const DismissConfirmation = () => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-60 p-4" role="dialog" aria-modal="true" aria-labelledby="dismiss-title" aria-describedby="dismiss-description">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
        <div className="text-center mb-4">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" aria-hidden="true" />
          <h3 id="dismiss-title" className="text-lg font-semibold text-gray-800 mb-2">
            Are you sure?
          </h3>
          <p id="dismiss-description" className="text-gray-600 text-sm">
            We're concerned about your wellbeing. Before you go, please consider reaching out for support.
          </p>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={() => {
              trackAction('called_crisis_line_dismiss_modal');
              const emergencyNumber = getPrimaryEmergencyNumber();
              window.open(`tel:${emergencyNumber}`, '_self');
            }}
            className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors focus:outline-none focus:ring-4 focus:ring-red-300 min-h-[50px]"
            aria-label={`Call crisis lifeline at ${getPrimaryEmergencyNumber()}`}
          >
            <Phone className="w-5 h-5 mx-auto mb-1" aria-hidden="true" />
            Call Crisis Lifeline
          </button>
          <button
            onClick={() => {
              trackAction('requested_professional_help_dismiss_modal');
              onGetHelp();
            }}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
            Get Professional Help
          </button>
          <button
            onClick={() => setShowDismissConfirmation(false)}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            Stay and Review Resources
          </button>
          <button
            onClick={() => {
              trackAction('dismissed_with_understanding');
              onClose();
            }}
            className="w-full px-4 py-2 text-gray-500 hover:text-gray-700 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 rounded"
          >
            Close (I understand the risks)
          </button>
        </div>
      </div>
    </div>
  );

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return '#DC2626'; // Red
      case 'high':
        return '#EA580C'; // Orange
      case 'medium':
        return '#D97706'; // Amber
      default:
        return '#6B7280'; // Gray
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <AlertTriangle className="w-6 h-6 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-6 h-6 text-orange-600" />;
      case 'medium':
        return <Heart className="w-6 h-6 text-amber-600" />;
      default:
        return <Heart className="w-6 h-6 text-gray-600" />;
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="crisis-title" aria-describedby="crisis-description">
        {/* Offline Status Indicator */}
        {!isOnline && (
          <div className="fixed top-4 right-4 bg-orange-500 text-white px-3 py-2 rounded-lg shadow-lg z-60">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-sm font-medium">Offline Mode</span>
            </div>
          </div>
        )}

        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          style={{ border: `3px solid ${getRiskColor(crisisAnalysis.riskLevel)}` }}
        >
          {/* Header */}
          <div 
            className="p-4 rounded-t-2xl text-white"
            style={{ backgroundColor: getRiskColor(crisisAnalysis.riskLevel) }}
            role="banner"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {getRiskIcon(crisisAnalysis.riskLevel)}
                <h2 id="crisis-title" className="ml-3 text-lg font-bold">
                  {getRiskTitle(crisisAnalysis.riskLevel)}
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Close alert"
                disabled={crisisAnalysis.riskLevel === 'critical'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Error Display */}
            {error && (
              <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-4" role="alert">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-2" aria-hidden="true" />
                  <p className="text-red-800 font-medium">System Alert</p>
                </div>
                <p className="text-red-700 text-sm mt-1">{error}</p>
                <div className="mt-3 space-y-2">
                  <button
                    onClick={() => {
                      trackAction('used_fallback_emergency_line');
                      window.open('tel:988', '_self');
                    }}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-4 focus:ring-red-300"
                  >
                    Call Crisis Lifeline: 988
                  </button>
                </div>
              </div>
            )}

            {/* Support Message */}
            <div className="text-center">
              <p id="crisis-description" className="text-gray-800 leading-relaxed text-base">
                {crisisAnalysis.supportMessage}
              </p>
            </div>

            {/* Keyboard Shortcuts Hint */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700 text-center">
              <KeyboardIcon className="w-4 h-4 inline mr-2" aria-hidden="true" />
              <span>Quick access: Press <kbd className="px-1 py-0.5 bg-blue-200 rounded text-xs">1</kbd> to call crisis line, <kbd className="px-1 py-0.5 bg-blue-200 rounded text-xs">2</kbd> for professional help</span>
            </div>

            {/* Emergency Contacts for Critical/High Risk */}
            {(crisisAnalysis.riskLevel === 'critical' || crisisAnalysis.riskLevel === 'high') && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4" role="region" aria-labelledby="emergency-contacts-title">
                <div className="flex items-center mb-3">
                  <Phone className="w-5 h-5 text-red-600 mr-2" aria-hidden="true" />
                  <h3 id="emergency-contacts-title" className="font-semibold text-red-800">Emergency Contacts - {currentUser.location.country}</h3>
                </div>
                <div className="space-y-2">
                  {safeEmergencyContacts.slice(0, 4).map((contact, index) => (
                    <div key={`emergency-${index}`} className="flex items-center text-sm text-red-700">
                      <span className="mr-2" aria-hidden="true">•</span>
                      <span>{contact}</span>
                    </div>
                  ))}
                </div>
                {!isOnline && (
                  <div className="mt-3 p-2 bg-orange-100 border border-orange-200 rounded text-xs text-orange-700">
                    <Shield className="w-3 h-3 inline mr-1" aria-hidden="true" />
                    Offline mode: Emergency numbers are stored locally for your safety
                  </div>
                )}
              </div>
            )}

          {/* Immediate Actions */}
          {crisisAnalysis.immediateActions.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-semibold text-blue-800 mb-3">Recommended Actions</h3>
              <div className="space-y-2">
                {crisisAnalysis.immediateActions.slice(0, 3).map((action, index) => (
                  <div key={index} className="flex items-start text-sm text-blue-700">
                    <span className="mr-2 mt-1">•</span>
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Check-in Information */}
          {crisisAnalysis.checkInScheduled && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-center mb-2">
                <Clock className="w-5 h-5 text-purple-600 mr-2" />
                <h3 className="font-semibold text-purple-800">Follow-up Scheduled</h3>
              </div>
              <p className="text-sm text-purple-700">
                We'll check in with you again to see how you're doing. Your wellbeing is important to us.
              </p>
            </div>
          )}

            {/* Action Buttons */}
            <div className="flex flex-col space-y-3" role="group" aria-label="Crisis support actions">
              {(crisisAnalysis.riskLevel === 'critical' || crisisAnalysis.riskLevel === 'high') && (
                <button
                  onClick={() => {
                    trackAction('called_crisis_line');
                    const emergencyNumber = getPrimaryEmergencyNumber();
                    window.open(`tel:${emergencyNumber}`, '_self');
                  }}
                  className="w-full px-6 py-4 bg-red-600 text-white rounded-xl text-lg font-bold hover:bg-red-700 transition-colors flex items-center justify-center min-h-[60px] focus:outline-none focus:ring-4 focus:ring-red-300 shadow-lg"
                  aria-label={`Call crisis lifeline at ${getPrimaryEmergencyNumber()}. Press 1 on keyboard for quick access.`}
                >
                  <Phone className="w-6 h-6 mr-3" aria-hidden="true" />
                  Call Crisis Lifeline ({getPrimaryEmergencyNumber()})
                </button>
              )}
              
              <button
                onClick={() => {
                  trackAction('requested_professional_help');
                  onGetHelp();
                }}
                className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors min-h-[60px] focus:outline-none focus:ring-4 focus:ring-blue-300 shadow-lg"
                aria-label="Get professional help. Press 2 on keyboard for quick access."
              >
                <Users className="w-6 h-6 mr-3" aria-hidden="true" />
                Get Professional Help
              </button>
              
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                aria-expanded={showDetails}
                aria-controls="crisis-details"
              >
                {showDetails ? 'Hide Details' : 'Show Details'}
              </button>
            </div>

            {/* Details Section */}
            {showDetails && (
              <div id="crisis-details" className="bg-gray-50 rounded-xl p-4 space-y-3" role="region" aria-labelledby="details-title">
                <div>
                  <h4 id="details-title" className="font-medium text-gray-800 mb-2">Risk Assessment</h4>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Risk Level:</span>
                    <span 
                      className="font-medium capitalize px-2 py-1 rounded text-white"
                      style={{ backgroundColor: getRiskColor(crisisAnalysis.riskLevel) }}
                    >
                      {crisisAnalysis.riskLevel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-600">Confidence:</span>
                    <span className="font-medium">
                      {Math.round(crisisAnalysis.confidenceScore * 100)}%
                    </span>
                  </div>
                  {actionsTracked.length > 0 && (
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-gray-600">Actions Taken:</span>
                      <span className="font-medium text-green-600">
                        {actionsTracked.length}
                      </span>
                    </div>
                  )}
                </div>
                
                {crisisAnalysis.indicators.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Detected Indicators</h4>
                    <div className="space-y-1">
                      {crisisAnalysis.indicators.slice(0, 3).map((indicator, index) => (
                        <div key={`indicator-${index}`} className="text-sm text-gray-600">
                          • {indicator}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="w-full px-4 py-3 text-gray-500 hover:text-gray-700 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 rounded"
              aria-label="Close crisis alert"
            >
              I understand
            </button>
          </div>
        </div>
      </div>

      {/* Dismiss Confirmation Modal */}
      {showDismissConfirmation && <DismissConfirmation />}
    </>
  );
}