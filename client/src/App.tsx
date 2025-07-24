// App.tsx
import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import NeonCursor from '@/components/neon-cursor';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  MessageCircle,
  Brain,
  BookOpen,
  Square,
  Gift,
  PieChart,
  Heart,
  Menu,
  X as XIcon,
  Search,
  Bell,
  User as UserIcon,
  Palette,
  Mic,
  Shield,
  Settings as SettingsIcon,
} from 'lucide-react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { SubscriptionModal } from './components/SubscriptionModal';
import { UsageLimitModal } from './components/UsageLimitModal';
import AuthModal from './components/AuthModal';

// Lazy‑loaded feature components
const Chat = lazy(() => import('./components/FloatingChat'));
const MemoryDashboard = lazy(() => import('./components/MemoryDashboard'));
const TherapeuticJournal = lazy(() => import('./components/TherapeuticJournal'));
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard'));
const WellnessRewards = lazy(() => import('./components/WellnessRewards'));
const CommunitySupport = lazy(() => import('./components/CommunitySupport'));
const PersonalityQuiz = lazy(() => import('./components/PersonalityQuiz'));
const PersonalityReflection = lazy(() => import('./components/PersonalityReflection'));
const AdaptiveLearning = lazy(() => import('./components/AdaptiveLearning'));
const AdaptiveTherapyPlan = lazy(() => import('./components/AdaptiveTherapyPlan'));
const AgentSystem = lazy(() => import('./components/AgentSystem'));
const VRTherapy = lazy(() => import('./components/VRTherapy'));
const HealthIntegration = lazy(() => import('./components/HealthIntegration'));
const PrivacyCompliance = lazy(() => import('./components/PrivacyCompliance'));
const TherapistPortal = lazy(() => import('./components/TherapistPortal'));
const VoiceSelector = lazy(() => import('./components/VoiceSelector'));
const ThemeSelector = lazy(() => import('./components/ThemeSelector'));
const FeedbackSystem = lazy(() => import('./components/FeedbackSystem'));

const queryClient = new QueryClient();

// Sidebar group + item helpers
const SidebarGroup: React.FC<{ title: string; collapsed: boolean; children: React.ReactNode }> = ({ title, children, collapsed }) => (
  <div className="mt-4">
    {!collapsed && <h2 className="px-4 text-xs uppercase text-gray-400">{title}</h2>}
    <nav className="mt-2">{children}</nav>
  </div>
);
const NavItem: React.FC<{ to: string; icon: React.FC<any>; label: string; collapsed: boolean }> = ({
  to,
  icon: Icon,
  label,
  collapsed,
}) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center px-4 py-2 mt-1 rounded-lg transition-colors ${
        isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`
    }
  >
    <Icon className="h-5 w-5" />
    {!collapsed && <span className="ml-3">{label}</span>}
  </NavLink>
);

// Sidebar component
const Sidebar: React.FC<{ collapsed: boolean }> = ({ collapsed }) => (
  <aside
    className={`bg-gray-800 text-white transition-width duration-200 ${
      collapsed ? 'w-16' : 'w-64'
    } hidden md:flex flex-col`}
  >
    <div className="flex items-center justify-center h-16">
      {!collapsed && <span className="text-2xl font-bold">Chakrai</span>}
    </div>
    <SidebarGroup title="🟦 Core Companion" collapsed={collapsed}>
      <NavItem to="/chat" icon={MessageCircle} label="Chat" collapsed={collapsed} />
      <NavItem to="/dashboard" icon={Brain} label="Dashboard" collapsed={collapsed} />
      <NavItem to="/rewards" icon={Gift} label="Rewards" collapsed={collapsed} />
    </SidebarGroup>
    <SidebarGroup title="💠 Mirrors of You" collapsed={collapsed}>
      <NavItem to="/journal" icon={BookOpen} label="Journal" collapsed={collapsed} />
      <NavItem to="/reflection" icon={Square} label="Reflection" collapsed={collapsed} />
      <NavItem to="/analytics" icon={PieChart} label="Analytics" collapsed={collapsed} />
    </SidebarGroup>
    <SidebarGroup title="🧘 Guided Support" collapsed={collapsed}>
      <NavItem to="/quiz" icon={Brain} label="Quiz" collapsed={collapsed} />
      <NavItem to="/adaptive" icon={SettingsIcon} label="Adaptive" collapsed={collapsed} />
      <NavItem to="/therapy" icon={Heart} label="Therapy Plan" collapsed={collapsed} />
    </SidebarGroup>
    <SidebarGroup title="⚙️ Settings" collapsed={collapsed}>
      <NavItem to="/settings/theme" icon={Palette} label="Theme" collapsed={collapsed} />
      <NavItem to="/settings/voice" icon={Mic} label="Voice" collapsed={collapsed} />
      <NavItem to="/settings/privacy" icon={Shield} label="Privacy" collapsed={collapsed} />
    </SidebarGroup>
  </aside>
);

// Dynamic header title based on route
const Header: React.FC<{ collapsed: boolean; setCollapsed: (c: boolean) => void }> = ({ collapsed, setCollapsed }) => {
  const location = useLocation();
  const titles: Record<string, string> = {
    '/chat': 'Chat',
    '/dashboard': 'Dashboard',
    '/journal': 'Journal',
    '/analytics': 'Analytics',
    '/rewards': 'Rewards',
    '/community': 'Community',
    '/quiz': 'Personality Quiz',
    '/reflection': 'Reflection',
    '/adaptive': 'Adaptive Learning',
    '/therapy': 'Therapy Plan',
    '/agent': 'Agent System',
    '/vr': 'VR Therapy',
    '/health': 'Health',
    '/privacy': 'Privacy',
    '/therapist': 'Therapist Portal',
    '/settings/theme': 'Theme Settings',
    '/settings/voice': 'Voice Settings',
  };
  const title = titles[location.pathname] || 'Home';

  return (
    <header className="flex items-center justify-between p-4 bg-white shadow">
      <div className="flex items-center">
        <button onClick={() => setCollapsed(!collapsed)} className="md:hidden mr-2 focus:outline-none">
          {collapsed ? <Menu /> : <XIcon />}
        </button>
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>
      <div className="flex items-center space-x-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            className="pl-8 pr-4 py-2 border rounded-lg focus:outline-none"
          />
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
        <Bell className="h-6 w-6 text-gray-600 cursor-pointer" />
        <UserIcon className="h-6 w-6 text-gray-600 cursor-pointer" />
      </div>
    </header>
  );
};

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showUsageLimitModal, setShowUsageLimitModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('james');

  return (
    <ThemeProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <QueryClientProvider client={queryClient}>
            <Router>
              <div className="flex h-screen overflow-hidden">
                <Sidebar collapsed={collapsed} />

                <div className="flex-1 flex flex-col">
                  <Header collapsed={collapsed} setCollapsed={setCollapsed} />

                  <main className="flex-1 overflow-auto bg-gray-100">
                    <div className="max-w-4xl mx-auto">
                      {/* Feature Header */}
                      <div className="theme-card backdrop-blur-sm rounded-xl p-6 border border-[var(--theme-accent)]/30 shadow-lg">
                        <h2 className="text-2xl font-bold theme-text text-center">
                          Chakrai Mental Wellness Platform
                        </h2>
                      </div>
                      <Suspense fallback={<div className="p-6">Loading...</div>}>
                        <Routes>
                          <Route path="/" element={<MemoryDashboard />} />
                          <Route path="/chat" element={<Chat isOpen={true} onToggle={() => {}} selectedVoice={selectedVoice} />} />
                          <Route path="/dashboard" element={<MemoryDashboard />} />
                          <Route path="/journal" element={<TherapeuticJournal userId={1} onEntryCreated={() => {}} />} />
                          <Route path="/analytics" element={<AnalyticsDashboard userId={1} />} />
                          <Route path="/rewards" element={<WellnessRewards />} />
                          <Route path="/community" element={<CommunitySupport />} />
                          <Route path="/quiz" element={<PersonalityQuiz onComplete={() => {}} />} />
                          <Route path="/reflection" element={<PersonalityReflection userId={1} />} />
                          <Route path="/adaptive" element={<AdaptiveLearning />} />
                          <Route path="/therapy" element={<AdaptiveTherapyPlan userId={1} onPlanUpdate={() => {}} />} />
                          <Route path="/agent" element={<AgentSystem userId={1} />} />
                          <Route path="/vr" element={<VRTherapy />} />
                          <Route path="/health" element={<HealthIntegration />} />
                          <Route path="/privacy" element={<PrivacyCompliance />} />
                          <Route path="/therapist" element={<TherapistPortal />} />
                          <Route path="/settings/theme" element={<ThemeSelector onClose={() => {}} />} />
                          <Route path="/settings/voice" element={<VoiceSelector selectedVoice={selectedVoice} onVoiceChange={setSelectedVoice} />} />
                          <Route path="*" element={<MemoryDashboard />} />
                        </Routes>
                      </Suspense>
                    </div>

                    {/* Global modals & cursor */}
                    <SubscriptionModal isOpen={showSubscriptionModal} onClose={() => setShowSubscriptionModal(false)} />
                    <UsageLimitModal isOpen={showUsageLimitModal} onClose={() => setShowUsageLimitModal(false)} onUpgrade={() => setShowSubscriptionModal(true)} />
                    <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onAuthSuccess={() => setShowAuthModal(false)} />
                    <NeonCursor />
                  </main>
                </div>
              </div>    
            </Router>
          </QueryClientProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}