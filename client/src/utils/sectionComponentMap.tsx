import React, { lazy, ComponentType } from 'react';

// Import components that definitely exist
const PersonalityReflection = lazy(() => import('../components/PersonalityReflection'));
const EnhancedJournalInterface = lazy(() => import('../components/EnhancedJournalInterface'));
const MemoryDashboard = lazy(() => import('../components/MemoryDashboard'));
const AnalyticsDashboard = lazy(() => import('../components/AnalyticsDashboard'));
const VoluntaryQuestionDeck = lazy(() => import('../components/VoluntaryQuestionDeck'));
const FeedbackSystem = lazy(() => import('../components/FeedbackSystem'));
const ChallengeSystem = lazy(() => import('../components/ChallengeSystem'));
const WellnessRewards = lazy(() => import('../components/WellnessRewards'));
const CommunitySupport = lazy(() => import('../components/CommunitySupport'));
const AdaptiveLearning = lazy(() => import('../components/AdaptiveLearning'));
const AdaptiveTherapyPlan = lazy(() => import('../components/AdaptiveTherapyPlan'));
const AgentSystem = lazy(() => import('../components/AgentSystem'));
const VRTherapy = lazy(() => import('../components/VRTherapy'));
const HealthIntegration = lazy(() => import('../components/HealthIntegration'));
const PrivacyCompliance = lazy(() => import('../components/PrivacyCompliance'));
const AiPerformanceMonitoringDashboard = lazy(() => import('../components/AiPerformanceMonitoringDashboard'));
const TherapeuticAnalytics = lazy(() => import('../components/TherapeuticAnalytics'));
const EHRIntegration = lazy(() => import('../components/EHRIntegration'));
const PrivacyPolicy = lazy(() => import('../components/PrivacyPolicy'));
const MicrophoneTest = lazy(() => import('../components/MicrophoneTest'));
const Horoscope = lazy(() => import('../components/Horoscope'));
const DailyAffirmation = lazy(() => import('../components/DailyAffirmation'));
const ThemeSelector = lazy(() => import('../components/ThemeSelector'));
const AlarmListPanel = lazy(() => import('../components/AlarmListPanel'));

const sectionComponentMap: Record<string, ComponentType<any>> = {
  daily: PersonalityReflection,
  journal: EnhancedJournalInterface,
  memory: MemoryDashboard,
  analytics: AnalyticsDashboard,
  questions: VoluntaryQuestionDeck,
  feedback: FeedbackSystem,
  challenges: ChallengeSystem,
  rewards: WellnessRewards,
  community: CommunitySupport,
  adaptive: AdaptiveLearning,
  'therapy-plans': AdaptiveTherapyPlan,
  agents: AgentSystem,
  vr: VRTherapy,
  health: HealthIntegration,
  'ambient-sound': () => <div className="flex items-center justify-center h-64 text-white/60">Ambient sound feature disabled due to audio quality issues</div>,
  privacy: PrivacyCompliance,
  therapist: AiPerformanceMonitoringDashboard,
  outcomes: TherapeuticAnalytics,
  ehr: EHRIntegration,
  'privacy-policy': PrivacyPolicy,
  'microphone-test': MicrophoneTest,
  horoscope: Horoscope,
  affirmation: DailyAffirmation,
  themes: () => (
    <div className="h-full theme-background p-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <ThemeSelector />
      </div>
    </div>
  ),
  alarms: AlarmListPanel,
};

// Function to get section component map with additional props if needed
export const getSectionComponentMap = async (props?: any) => {
  return sectionComponentMap;
};

export default sectionComponentMap;
