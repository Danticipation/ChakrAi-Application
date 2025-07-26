import React, { lazy } from 'react';
import { getCurrentUserId as fetchCurrentUserId } from '@/utils/userSession';

const PersonalityReflection = lazy(() => import('@/components/PersonalityReflection'));
const TherapeuticJournal = lazy(() => import('@/components/TherapeuticJournal'));
const MemoryDashboard = lazy(() => import('@/components/MemoryDashboard'));
const AnalyticsDashboard = lazy(() => import('@/components/AnalyticsDashboard'));
const VoluntaryQuestionDeck = lazy(() => import('@/components/VoluntaryQuestionDeck'));
const FeedbackSystem = lazy(() => import('@/components/FeedbackSystem'));
const ChallengeSystem = lazy(() => import('@/components/ChallengeSystem'));
const WellnessRewards = lazy(() => import('@/components/WellnessRewards'));
const CommunitySupport = lazy(() => import('@/components/CommunitySupport'));
const AdaptiveLearning = lazy(() => import('@/components/AdaptiveLearning'));
const AdaptiveTherapyPlan = lazy(() => import('@/components/AdaptiveTherapyPlan'));
const AgentSystem = lazy(() => import('@/components/AgentSystem'));
const VRTherapy = lazy(() => import('@/components/VRTherapy'));
const HealthIntegration = lazy(() => import('@/components/HealthIntegration'));
const PrivacyCompliance = lazy(() => import('@/components/PrivacyCompliance'));
const AiPerformanceMonitoringDashboard = lazy(() => import('@/components/AiPerformanceMonitoringDashboard'));
const TherapeuticAnalytics = lazy(() => import('@/components/TherapeuticAnalytics'));
const EHRIntegration = lazy(() => import('@/components/EHRIntegration'));
const PrivacyPolicy = lazy(() => import('@/components/PrivacyPolicy'));
const MicrophoneTest = lazy(() => import('@/components/MicrophoneTest'));
const Horoscope = lazy(() => import('@/components/Horoscope'));
const DailyAffirmation = lazy(() => import('@/components/DailyAffirmation'));
const ThemeSelector = lazy(() => import('@/components/ThemeSelector'));
const AlarmListPanel = lazy(() => import('@/components/AlarmListPanel'));

interface SectionComponentMapParams {
  fetchStreakStats: () => void;
  setActiveSection: (section: string) => void;
  handleMobileModalNavigation: (section: string) => void;
}

export const getSectionComponentMap = ({ fetchStreakStats, setActiveSection, handleMobileModalNavigation }: SectionComponentMapParams) => {
  const userId = fetchCurrentUserId();

  return {
    'daily': <PersonalityReflection userId={userId} />, 
    'journal': <TherapeuticJournal userId={userId} onEntryCreated={fetchStreakStats} />, 
    'memory': <MemoryDashboard />, 
    'analytics': <AnalyticsDashboard userId={userId} />, 
    'questions': <VoluntaryQuestionDeck />, 
    'feedback': <FeedbackSystem />, 
    'challenges': <ChallengeSystem onNavigate={setActiveSection} onMobileModalNavigate={handleMobileModalNavigation} />, 
    'rewards': <WellnessRewards />, 
    'community': <CommunitySupport />, 
    'adaptive': <AdaptiveLearning />, 
    'therapy-plans': <AdaptiveTherapyPlan userId={userId} onPlanUpdate={console.log} />, 
    'agents': <AgentSystem userId={userId} />, 
    'vr': <VRTherapy />, 
    'health': <HealthIntegration />, 
    'ambient-sound': <div className="flex items-center justify-center h-64 text-white/60">Ambient sound feature disabled due to audio quality issues</div>, 
    'privacy': <PrivacyCompliance />, 
    'therapist': <AiPerformanceMonitoringDashboard />, 
    'outcomes': <TherapeuticAnalytics userId={userId} />, 
    'ehr': <EHRIntegration />, 
    'privacy-policy': <PrivacyPolicy />, 
    'microphone-test': <MicrophoneTest />, 
    'horoscope': <Horoscope onBack={() => setActiveSection('chat')} />, 
    'affirmation': <DailyAffirmation onBack={() => setActiveSection('chat')} />, 
    'themes': (
      <div className="h-full theme-background p-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          <ThemeSelector onClose={() => setActiveSection('chat')} />
        </div>
      </div>
    ),
    'alarms': <AlarmListPanel />
  };
};