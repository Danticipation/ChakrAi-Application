//utils/__tests__/uiRenderer.test.tsx
import React from 'react';
import { render } from '@testing-library/react';
import { renderMainContent } from '../uiRenderer';

jest.mock('@/utils/userSession', () => ({
  getCurrentUserId: () => 42,
}));

// Mock all components used in renderMainContent
jest.mock('@/components/PersonalityReflection', () => () => <div>PersonalityReflection</div>);
jest.mock('@/components/TherapeuticJournal', () => () => <div>TherapeuticJournal</div>);
jest.mock('@/components/MemoryDashboard', () => () => <div>MemoryDashboard</div>);
jest.mock('@/components/AnalyticsDashboard', () => () => <div>AnalyticsDashboard</div>);
jest.mock('@/components/VoluntaryQuestionDeck', () => () => <div>VoluntaryQuestionDeck</div>);
jest.mock('@/components/FeedbackSystem', () => () => <div>FeedbackSystem</div>);
jest.mock('@/components/ChallengeSystem', () => () => <div>ChallengeSystem</div>);
jest.mock('@/components/WellnessRewards', () => () => <div>WellnessRewards</div>);
jest.mock('@/components/CommunitySupport', () => () => <div>CommunitySupport</div>);
jest.mock('@/components/AdaptiveLearning', () => () => <div>AdaptiveLearning</div>);
jest.mock('@/components/AdaptiveTherapyPlan', () => () => <div>AdaptiveTherapyPlan</div>);
jest.mock('@/components/AgentSystem', () => () => <div>AgentSystem</div>);
jest.mock('@/components/VRTherapy', () => () => <div>VRTherapy</div>);
jest.mock('@/components/HealthIntegration', () => () => <div>HealthIntegration</div>);
jest.mock('@/components/PrivacyCompliance', () => () => <div>PrivacyCompliance</div>);
jest.mock('@/components/AiPerformanceMonitoringDashboard', () => () => <div>AiPerformanceMonitoringDashboard</div>);
jest.mock('@/components/TherapeuticAnalytics', () => () => <div>TherapeuticAnalytics</div>);
jest.mock('@/components/EHRIntegration', () => () => <div>EHRIntegration</div>);
jest.mock('@/components/PrivacyPolicy', () => () => <div>PrivacyPolicy</div>);
jest.mock('@/components/MicrophoneTest', () => () => <div>MicrophoneTest</div>);
jest.mock('@/components/Horoscope', () => () => <div>Horoscope</div>);
jest.mock('@/components/DailyAffirmation', () => () => <div>DailyAffirmation</div>);
jest.mock('@/components/ThemeSelector', () => () => <div>ThemeSelector</div>);

describe('renderMainContent', () => {
  const fetchStreakStats = jest.fn();
  const setActiveSection = jest.fn();
  const handleMobileModalNavigation = jest.fn();

  const testCases = [
    { section: 'daily', expected: 'PersonalityReflection' },
    { section: 'journal', expected: 'TherapeuticJournal' },
    { section: 'memory', expected: 'MemoryDashboard' },
    { section: 'analytics', expected: 'AnalyticsDashboard' },
    { section: 'questions', expected: 'VoluntaryQuestionDeck' },
    { section: 'feedback', expected: 'FeedbackSystem' },
    { section: 'challenges', expected: 'ChallengeSystem' },
    { section: 'rewards', expected: 'WellnessRewards' },
    { section: 'community', expected: 'CommunitySupport' },
    { section: 'adaptive', expected: 'AdaptiveLearning' },
    { section: 'therapy-plans', expected: 'AdaptiveTherapyPlan' },
    { section: 'agents', expected: 'AgentSystem' },
    { section: 'vr', expected: 'VRTherapy' },
    { section: 'health', expected: 'HealthIntegration' },
    { section: 'privacy', expected: 'PrivacyCompliance' },
    { section: 'therapist', expected: 'AiPerformanceMonitoringDashboard' },
    { section: 'outcomes', expected: 'TherapeuticAnalytics' },
    { section: 'ehr', expected: 'EHRIntegration' },
    { section: 'privacy-policy', expected: 'PrivacyPolicy' },
    { section: 'microphone-test', expected: 'MicrophoneTest' },
    { section: 'horoscope', expected: 'Horoscope' },
    { section: 'affirmation', expected: 'DailyAffirmation' },
    { section: 'themes', expected: 'ThemeSelector' },
  ];

  testCases.forEach(({ section, expected }) => {
    it(`renders ${expected} for section="${section}"`, () => {
      const { getByText } = render(
        renderMainContent(section, fetchStreakStats, setActiveSection, handleMobileModalNavigation)
      );
      expect(getByText(expected)).toBeInTheDocument();
    });
  });

  it('renders default placeholder for unknown section', () => {
    const { getByText } = render(
      renderMainContent('unknown-section', fetchStreakStats, setActiveSection, handleMobileModalNavigation)
    );
    expect(getByText('Feature coming soon...')).toBeInTheDocument();
  });
});
