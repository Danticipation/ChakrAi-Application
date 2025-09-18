import React, { useState, useEffect } from 'react';
import { Star, Microscope, BookOpen, ExternalLink, Calendar, TrendingUp } from 'lucide-react';

interface Study {
  id: string;
  title: string;
  summary: string;
  source: string;
  date: string;
  category: 'mental-health' | 'neuroscience' | 'medicine' | 'wellness';
  url?: string;
}

interface HoroscopeData {
  sign: string;
  horoscope: string;
  date: string;
}

const zodiacSigns = [
  { name: 'aries', symbol: 'â™ˆ', emoji: 'ðŸ' },
  { name: 'taurus', symbol: 'â™‰', emoji: 'ðŸ‚' },
  { name: 'gemini', symbol: 'â™Š', emoji: 'ðŸ‘¯' },
  { name: 'cancer', symbol: 'â™‹', emoji: 'ðŸ¦€' },
  { name: 'leo', symbol: 'â™Œ', emoji: 'ðŸ¦' },
  { name: 'virgo', symbol: 'â™', emoji: 'ðŸ‘©' },
  { name: 'libra', symbol: 'â™Ž', emoji: 'âš–ï¸' },
  { name: 'scorpio', symbol: 'â™', emoji: 'ðŸ¦‚' },
  { name: 'sagittarius', symbol: 'â™', emoji: 'ðŸ¹' },
  { name: 'capricorn', symbol: 'â™‘', emoji: 'ðŸ' },
  { name: 'aquarius', symbol: 'â™’', emoji: 'ðŸº' },
  { name: 'pisces', symbol: 'â™“', emoji: 'ðŸŸ' }
];

export default function StarsAndStudies() {
  const [selectedSign, setSelectedSign] = useState<string>('');
  const [horoscopeData, setHoroscopeData] = useState<HoroscopeData | null>(null);
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(false);
  const [studiesLoading, setStudiesLoading] = useState(false);

  useEffect(() => {
    fetchLatestStudies();
  }, []);

  const fetchHoroscope = async (sign: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/horoscope/${sign}`);
      if (response.ok) {
        const data = await response.json();
        setHoroscopeData({
          sign: sign.charAt(0).toUpperCase() + sign.slice(1),
          horoscope: data.horoscope,
          date: new Date().toLocaleDateString()
        });
      }
    } catch (error) {
      console.error('Error fetching horoscope:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestStudies = async () => {
    setStudiesLoading(true);
    setStudies([
      {
        id: '1',
        title: 'Mindfulness Meditation Reduces Anxiety in Clinical Trials',
        summary: 'New research shows 8-week mindfulness programs significantly reduce anxiety symptoms in 78% of participants.',
        source: 'Journal of Clinical Psychology',
        date: '2024-01-15',
        category: 'mental-health'
      },
      {
        id: '2',
        title: 'Breakthrough in Depression Treatment Using Light Therapy',
        summary: 'Scientists discover optimal light wavelengths for treating seasonal depression with 85% success rate.',
        source: 'Nature Medicine',
        date: '2024-01-12',
        category: 'neuroscience'
      }
    ]);
    setStudiesLoading(false);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'mental-health': 'bg-blue-500',
      'neuroscience': 'bg-purple-500',
      'medicine': 'bg-green-500',
      'wellness': 'bg-orange-500'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="flex items-center space-x-2">
          <Star className="text-purple-400" size={28} />
          <Microscope className="text-blue-400" size={28} />
        </div>
        <h2 className="text-2xl font-bold theme-text">Stars & Studies</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Horoscope Section */}
        <div className="theme-card rounded-xl p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Star className="text-purple-400" size={20} />
            <h3 className="text-xl font-semibold theme-text">Daily Horoscope</h3>
          </div>

          <div className="mb-4">
            <select
              value={selectedSign}
              onChange={(e) => {
                setSelectedSign(e.target.value);
                if (e.target.value) fetchHoroscope(e.target.value);
              }}
              className="w-full p-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:outline-none"
            >
              <option value="">Select your zodiac sign</option>
              {zodiacSigns.map((sign) => (
                <option key={sign.name} value={sign.name}>
                  {sign.emoji} {sign.name.charAt(0).toUpperCase() + sign.name.slice(1)} {sign.symbol}
                </option>
              ))}
            </select>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
              <p className="theme-text-secondary">Consulting the stars...</p>
            </div>
          )}

          {horoscopeData && !loading && (
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-purple-800">
                  {zodiacSigns.find(s => s.name === selectedSign)?.emoji || 'â­'} {horoscopeData.sign}
                </h4>
                <span className="text-sm text-purple-600">{horoscopeData.date}</span>
              </div>
              <p className="text-purple-700 leading-relaxed">{horoscopeData.horoscope}</p>
            </div>
          )}
        </div>

        {/* Latest Studies Section */}
        <div className="theme-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Microscope className="text-blue-400" size={20} />
              <h3 className="text-xl font-semibold theme-text">Latest Research</h3>
            </div>
            <button
              onClick={fetchLatestStudies}
              className="text-blue-500 hover:text-blue-600 text-sm font-medium"
            >
              Refresh
            </button>
          </div>

          {studiesLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="theme-text-secondary">Loading latest studies...</p>
            </div>
          )}

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {studies.map((study) => (
              <div key={study.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs text-white ${getCategoryColor(study.category)}`}>
                      {study.category.replace('-', ' ')}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center">
                      <Calendar size={12} className="mr-1" />
                      {new Date(study.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <h4 className="font-semibold theme-text mb-2 line-clamp-2">{study.title}</h4>
                <p className="theme-text-secondary text-sm mb-2 line-clamp-3">{study.summary}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{study.source}</span>
                  {study.url && (
                    <a
                      href={study.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600 text-xs flex items-center"
                    >
                      Read more <ExternalLink size={12} className="ml-1" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="theme-card rounded-lg p-4 text-center">
          <BookOpen className="mx-auto mb-2 text-green-500" size={24} />
          <div className="text-2xl font-bold theme-text">{studies.length}</div>
          <div className="text-sm theme-text-secondary">Recent Studies</div>
        </div>
        
        <div className="theme-card rounded-lg p-4 text-center">
          <TrendingUp className="mx-auto mb-2 text-blue-500" size={24} />
          <div className="text-2xl font-bold theme-text">{studies.filter(s => s.category === 'mental-health').length}</div>
          <div className="text-sm theme-text-secondary">Mental Health Studies</div>
        </div>
        
        <div className="theme-card rounded-lg p-4 text-center">
          <Star className="mx-auto mb-2 text-purple-500" size={24} />
          <div className="text-2xl font-bold theme-text">12</div>
          <div className="text-sm theme-text-secondary">Zodiac Signs</div>
        </div>
      </div>
    </div>
  );
}
