import React, { useState } from 'react';
import { 
  MessageCircle, Brain, BookOpen, Mic, User, Target, BarChart3, 
  Gift, Headphones, Shield, Settings, ChevronDown, ChevronRight,
  Heart, Users, Sparkles, Zap, Star
} from 'lucide-react';

interface AnimatedSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  collapsedSections: { [key: string]: boolean };
  setCollapsedSections: (sections: { [key: string]: boolean }) => void;
}

const AnimatedSidebar: React.FC<AnimatedSidebarProps> = ({
  activeSection,
  setActiveSection,
  collapsedSections,
  setCollapsedSections
}) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setCollapsedSections({
      ...collapsedSections,
      [section]: !collapsedSections[section]
    });
  };

  const MenuItem = ({ 
    id, 
    icon: Icon, 
    label, 
    isActive = false, 
    badge = null,
    gradient = "from-blue-500 to-purple-600",
    onClick 
  }: {
    id: string;
    icon: React.ComponentType<any>;
    label: string;
    isActive?: boolean;
    badge?: string | null;
    gradient?: string;
    onClick: () => void;
  }) => {
    const isHovered = hoveredItem === id;

    return (
      <div
        className={`relative group cursor-pointer transition-all duration-300 ${
          isActive ? 'scale-105' : 'hover:scale-102'
        }`}
        onMouseEnter={() => setHoveredItem(id)}
        onMouseLeave={() => setHoveredItem(null)}
        onClick={onClick}
      >
        {/* Glow Effect */}
        {(isActive || isHovered) && (
          <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-20 rounded-xl blur-sm transition-all duration-300`} />
        )}

        <div className={`relative flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 ${
          isActive 
            ? 'bg-white/20 backdrop-blur-sm text-white shadow-lg border border-white/30' 
            : isHovered
            ? 'bg-white/15 backdrop-blur-sm text-white'
            : 'text-white/80 hover:text-white'
        }`}>
          {/* Icon with Animation */}
          <div className={`relative p-2 rounded-lg transition-all duration-300 ${
            isActive 
              ? `bg-gradient-to-r ${gradient} shadow-lg` 
              : isHovered
              ? `bg-gradient-to-r ${gradient} opacity-80`
              : 'bg-white/10'
          }`}>
            <Icon className={`w-4 h-4 transition-all duration-300 ${
              isActive || isHovered ? 'animate-pulse' : ''
            }`} />
          </div>

          {/* Label */}
          <span className={`font-medium transition-all duration-300 ${
            isActive ? 'text-white' : 'text-white/90'
          }`}>
            {label}
          </span>

          {/* Badge */}
          {badge && (
            <div className="ml-auto">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                {badge}
              </div>
            </div>
          )}

          {/* Active Indicator */}
          {isActive && (
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2">
              <div className="w-2 h-2 bg-white rounded-full animate-ping" />
            </div>
          )}

          {/* Hover Sparkles */}
          {isHovered && !isActive && (
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 3 }).map((_, i) => (
                <Sparkles
                  key={i}
                  className="absolute w-3 h-3 text-white/60 animate-ping"
                  style={{
                    left: `${20 + i * 25}%`,
                    top: `${30 + i * 10}%`,
                    animationDelay: `${i * 0.3}s`
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const SectionHeader = ({ 
    id, 
    title, 
    icon: Icon, 
    isCollapsed, 
    gradient = "from-blue-500 to-purple-600" 
  }: {
    id: string;
    title: string;
    icon: React.ComponentType<any>;
    isCollapsed: boolean;
    gradient?: string;
  }) => (
    <div
      className="flex items-center justify-between p-3 cursor-pointer group hover:bg-white/10 rounded-xl transition-all duration-300"
      onClick={() => toggleSection(id)}
    >
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg bg-gradient-to-r ${gradient} group-hover:animate-pulse transition-all duration-300`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-white/90 group-hover:text-white transition-colors duration-300">
          {title}
        </span>
      </div>
      <div className="transition-transform duration-300">
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-white/60 group-hover:text-white" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/60 group-hover:text-white" />
        )}
      </div>
    </div>
  );

  return (
    <div className="w-80 bg-gradient-to-b from-slate-900 via-blue-900 to-purple-900 text-white p-6 space-y-4 overflow-y-auto border-r border-white/10">
      {/* Header with Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Chakrai
          </h1>
        </div>
        <p className="text-white/70 text-sm">AI Wellness Companion</p>
      </div>

      {/* Navigation Sections */}
      <div className="space-y-6">
        {/* Core Features */}
        <div>
          <SectionHeader
            id="core"
            title="Core Features"
            icon={Star}
            isCollapsed={collapsedSections.core}
            gradient="from-blue-500 to-cyan-600"
          />
          {!collapsedSections.core && (
            <div className="ml-4 mt-2 space-y-2">
              <MenuItem
                id="home"
                icon={Sparkles}
                label="Home"
                isActive={activeSection === 'home'}
                onClick={() => setActiveSection('home')}
                gradient="from-blue-500 to-purple-600"
              />
              <MenuItem
                id="chat"
                icon={MessageCircle}
                label="AI Chat"
                isActive={activeSection === 'chat'}
                badge="Popular"
                onClick={() => setActiveSection('chat')}
                gradient="from-blue-500 to-indigo-600"
              />
              <MenuItem
                id="journal"
                icon={BookOpen}
                label="Smart Journal"
                isActive={activeSection === 'journal'}
                onClick={() => setActiveSection('journal')}
                gradient="from-green-500 to-teal-600"
              />
              <MenuItem
                id="analytics"
                icon={BarChart3}
                label="Progress Analytics"
                isActive={activeSection === 'analytics'}
                onClick={() => setActiveSection('analytics')}
                gradient="from-purple-500 to-pink-600"
              />
            </div>
          )}
        </div>

        {/* Wellness Tools */}
        <div>
          <SectionHeader
            id="wellness"
            title="Wellness Tools"
            icon={Heart}
            isCollapsed={collapsedSections.wellness}
            gradient="from-rose-500 to-pink-600"
          />
          {!collapsedSections.wellness && (
            <div className="ml-4 mt-2 space-y-2">
              <MenuItem
                id="meditation"
                icon={Heart}
                label="Meditation"
                isActive={activeSection === 'meditation'}
                onClick={() => setActiveSection('meditation')}
                gradient="from-rose-500 to-pink-600"
              />
              <MenuItem
                id="memory"
                icon={Target}
                label="Memory Insights"
                isActive={activeSection === 'memory'}
                onClick={() => setActiveSection('memory')}
                gradient="from-indigo-500 to-blue-600"
              />
              <MenuItem
                id="rewards"
                icon={Gift}
                label="Wellness Rewards"
                isActive={activeSection === 'rewards'}
                badge="New"
                onClick={() => setActiveSection('rewards')}
                gradient="from-yellow-500 to-orange-600"
              />
            </div>
          )}
        </div>

        {/* Community */}
        <div>
          <SectionHeader
            id="community"
            title="Community"
            icon={Users}
            isCollapsed={collapsedSections.community}
            gradient="from-cyan-500 to-blue-600"
          />
          {!collapsedSections.community && (
            <div className="ml-4 mt-2 space-y-2">
              <MenuItem
                id="community"
                icon={Users}
                label="Support Forums"
                isActive={activeSection === 'community'}
                onClick={() => setActiveSection('community')}
                gradient="from-cyan-500 to-blue-600"
              />
            </div>
          )}
        </div>

        {/* Settings */}
        <div>
          <SectionHeader
            id="settings"
            title="Settings & Privacy"
            icon={Settings}
            isCollapsed={collapsedSections.settings}
            gradient="from-gray-500 to-slate-600"
          />
          {!collapsedSections.settings && (
            <div className="ml-4 mt-2 space-y-2">
              <MenuItem
                id="privacy"
                icon={Shield}
                label="Privacy & Security"
                isActive={activeSection === 'privacy'}
                badge="Secure"
                onClick={() => setActiveSection('privacy')}
                gradient="from-gray-500 to-slate-600"
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer with Status */}
      <div className="mt-auto pt-6 border-t border-white/10">
        <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
          <span className="text-sm text-white/80">System Active</span>
        </div>
      </div>
    </div>
  );
};

export default AnimatedSidebar;