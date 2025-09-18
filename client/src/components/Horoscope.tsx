import React, { useState } from 'react';
import { Star, Loader2, Volume2, VolumeX, X, ArrowLeft } from 'lucide-react';

interface HoroscopeProps {
  onBack?: () => void;
}

const zodiacSigns = [
  { name: 'aries', symbol: 'â™ˆ', emoji: 'ðŸ', dates: 'Mar 21 - Apr 19' },
  { name: 'taurus', symbol: 'â™‰', emoji: 'ðŸ‚', dates: 'Apr 20 - May 20' },
  { name: 'gemini', symbol: 'â™Š', emoji: 'ðŸ‘¯', dates: 'May 21 - Jun 20' },
  { name: 'cancer', symbol: 'â™‹', emoji: 'ðŸ¦€', dates: 'Jun 21 - Jul 22' },
  { name: 'leo', symbol: 'â™Œ', emoji: 'ðŸ¦', dates: 'Jul 23 - Aug 22' },
  { name: 'virgo', symbol: 'â™', emoji: 'ðŸ‘©', dates: 'Aug 23 - Sep 22' },
  { name: 'libra', symbol: 'â™Ž', emoji: 'âš–ï¸', dates: 'Sep 23 - Oct 22' },
  { name: 'scorpio', symbol: 'â™', emoji: 'ðŸ¦‚', dates: 'Oct 23 - Nov 21' },
  { name: 'sagittarius', symbol: 'â™', emoji: 'ðŸ¹', dates: 'Nov 22 - Dec 21' },
  { name: 'capricorn', symbol: 'â™‘', emoji: 'ðŸ', dates: 'Dec 22 - Jan 19' },
  { name: 'aquarius', symbol: 'â™’', emoji: 'ðŸº', dates: 'Jan 20 - Feb 18' },
  { name: 'pisces', symbol: 'â™“', emoji: 'ðŸŸ', dates: 'Feb 19 - Mar 20' }
];

// Constellation patterns for each zodiac sign
const constellationPatterns = {
  aries: [
    { x: 30, y: 20, intensity: 0.9 },
    { x: 50, y: 35, intensity: 0.8 },
    { x: 70, y: 25, intensity: 0.7 }
  ],
  taurus: [
    { x: 25, y: 30, intensity: 0.8 },
    { x: 45, y: 20, intensity: 0.9 },
    { x: 65, y: 40, intensity: 0.7 },
    { x: 75, y: 25, intensity: 0.6 }
  ],
  gemini: [
    { x: 20, y: 25, intensity: 0.8 },
    { x: 35, y: 15, intensity: 0.9 },
    { x: 65, y: 20, intensity: 0.9 },
    { x: 80, y: 30, intensity: 0.8 }
  ],
  cancer: [
    { x: 40, y: 20, intensity: 0.8 },
    { x: 30, y: 35, intensity: 0.7 },
    { x: 60, y: 30, intensity: 0.9 },
    { x: 50, y: 45, intensity: 0.6 }
  ],
  leo: [
    { x: 25, y: 15, intensity: 0.9 },
    { x: 40, y: 25, intensity: 0.8 },
    { x: 55, y: 20, intensity: 0.7 },
    { x: 70, y: 35, intensity: 0.8 },
    { x: 60, y: 45, intensity: 0.6 }
  ],
  virgo: [
    { x: 30, y: 25, intensity: 0.7 },
    { x: 45, y: 15, intensity: 0.8 },
    { x: 60, y: 30, intensity: 0.9 },
    { x: 75, y: 20, intensity: 0.6 }
  ],
  libra: [
    { x: 35, y: 20, intensity: 0.8 },
    { x: 50, y: 30, intensity: 0.9 },
    { x: 65, y: 25, intensity: 0.8 }
  ],
  scorpio: [
    { x: 20, y: 30, intensity: 0.9 },
    { x: 35, y: 20, intensity: 0.8 },
    { x: 50, y: 35, intensity: 0.7 },
    { x: 65, y: 25, intensity: 0.8 },
    { x: 80, y: 40, intensity: 0.6 }
  ],
  sagittarius: [
    { x: 25, y: 25, intensity: 0.8 },
    { x: 45, y: 15, intensity: 0.9 },
    { x: 65, y: 30, intensity: 0.7 },
    { x: 75, y: 40, intensity: 0.6 }
  ],
  capricorn: [
    { x: 30, y: 20, intensity: 0.7 },
    { x: 50, y: 30, intensity: 0.8 },
    { x: 70, y: 25, intensity: 0.9 },
    { x: 60, y: 40, intensity: 0.6 }
  ],
  aquarius: [
    { x: 25, y: 15, intensity: 0.8 },
    { x: 40, y: 30, intensity: 0.9 },
    { x: 55, y: 20, intensity: 0.7 },
    { x: 70, y: 35, intensity: 0.8 }
  ],
  pisces: [
    { x: 20, y: 25, intensity: 0.7 },
    { x: 40, y: 15, intensity: 0.8 },
    { x: 60, y: 25, intensity: 0.8 },
    { x: 80, y: 35, intensity: 0.9 }
  ]
};

export default function Horoscope({ onBack }: HoroscopeProps) {
  const [selectedSign, setSelectedSign] = useState<string | null>(null);
  const [horoscopeData, setHoroscopeData] = useState<{ sign: string; horoscope: string; date: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

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

  const handleSignChange = (sign: string) => {
    setSelectedSign(sign);
    fetchHoroscope(sign);
    setIsModalOpen(true);
  };

  const handleVoiceReading = async () => {
    if (!horoscopeData) return;

    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
      setIsVoiceLoading(false);
      return;
    }

    setIsVoiceLoading(true);
    try {
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: horoscopeData.horoscope,
          voice: 'carla'
        })
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        audio.onended = () => {
          setCurrentAudio(null);
          setIsVoiceLoading(false);
        };

        setCurrentAudio(audio);
        await audio.play();
      }
    } catch (error) {
      console.error('Voice reading error:', error);
    } finally {
      setIsVoiceLoading(false);
    }
  };

  const ConstellationBackground = ({ sign }: { sign: string }) => {
    const pattern = constellationPatterns[sign as keyof typeof constellationPatterns] || [];

    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 60">
        <defs>
          <radialGradient id={`starGlow-${sign}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#e0e7ff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#c7d2fe" stopOpacity="0.1" />
          </radialGradient>
        </defs>

        {pattern.map((star, index) => (
          <g key={index}>
            <circle
              cx={star.x}
              cy={star.y}
              r={star.intensity * 1.5}
              fill={`url(#starGlow-${sign})`}
              className="animate-pulse"
              style={{ animationDelay: `${index * 0.5}s` }}
            />
            <circle
              cx={star.x}
              cy={star.y}
              r={star.intensity * 0.5}
              fill="#ffffff"
              className="animate-pulse"
              style={{ animationDelay: `${index * 0.5}s` }}
            />
          </g>
        ))}

        {/* Constellation lines */}
        {pattern.length > 1 && pattern.map((star, index) => {
          if (index === pattern.length - 1) return null;
          const nextStar = pattern[index + 1];
          if (!nextStar) return null;
          return (
            <line
              key={`line-${index}`}
              x1={star.x}
              y1={star.y}
              x2={nextStar.x}
              y2={nextStar.y}
              stroke="#e0e7ff"
              strokeWidth="0.5"
              strokeOpacity="0.4"
              className="animate-pulse"
              style={{ animationDelay: `${index * 0.3}s` }}
            />
          );
        })}
      </svg>
    );
  };

  return (
    <div className="h-full theme-background overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Star className="text-purple-400" size={32} />
            <h1 className="text-3xl font-bold text-white">Daily Horoscope</h1>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <span>â† Back</span>
            </button>
          )}
        </div>

        {!selectedSign && (
          <div className="text-center text-white/80 mb-8">
            <Star className="mx-auto mb-4 text-purple-400" size={48} />
            <h2 className="text-2xl font-semibold mb-2">Choose Your Zodiac Sign</h2>
            <p className="text-lg">Select your sign to receive personalized cosmic guidance</p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {zodiacSigns.map((sign) => (
            <button
              key={sign.name}
              onClick={() => handleSignChange(sign.name)}
              className={`relative overflow-hidden p-6 rounded-2xl border-2 text-center transition-all duration-300 group ${
                selectedSign === sign.name
                  ? 'border-purple-400 bg-gradient-to-br from-purple-900/60 to-blue-900/60 shadow-2xl scale-105 ring-4 ring-purple-400/30'
                  : 'border-purple-600/30 bg-gradient-to-br from-purple-900/30 to-blue-900/30 hover:border-purple-400/50 hover:shadow-xl hover:scale-102'
              }`}
            >
              <ConstellationBackground sign={sign.name} />

              <div className="relative z-10">
                <div className="text-4xl mb-3 group-hover:animate-bounce">{sign.emoji}</div>
                <div className="text-2xl mb-2 text-purple-200">{sign.symbol}</div>
                <div className="text-lg capitalize font-semibold text-white mb-1">{sign.name}</div>
                <div className="text-xs text-purple-300">{sign.dates}</div>
              </div>

              {selectedSign === sign.name && (
                <div className="absolute top-2 right-2 w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
              )}
            </button>
          ))}
        </div>

        {/* Full-screen Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
              <div className="sticky top-0 bg-gradient-to-r from-purple-800 to-blue-800 p-6 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <Star className="text-purple-300" size={28} />
                    <h2 className="text-2xl font-bold text-white">Your Daily Horoscope</h2>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-white/80 hover:text-white text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {loading && (
                  <div className="flex items-center justify-center space-x-3 py-12">
                    <Loader2 className="animate-spin text-purple-400" size={32} />
                    <span className="text-white text-lg">Consulting the stars...</span>
                  </div>
                )}

                {horoscopeData && !loading && (
                  <div className="space-y-6">
                    <div className="bg-purple-800/40 rounded-xl p-6 border border-purple-400/30">
                      <h3 className="text-2xl font-bold text-purple-200 mb-2 flex items-center">
                        {zodiacSigns.find(s => s.name === selectedSign)?.emoji} {horoscopeData.sign} Horoscope
                      </h3>
                      <p className="text-purple-300">{horoscopeData.date}</p>
                    </div>

                    <div className="bg-blue-900/40 rounded-xl p-8 border border-blue-400/30">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-xl font-semibold text-blue-200">Your Cosmic Guidance</h4>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => {
                              setSelectedSign(null);
                              setHoroscopeData(null);
                            }}
                            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                          >
                            <ArrowLeft size={16} />
                            <span className="text-sm">Back to Signs</span>
                          </button>
                          <button
                            onClick={handleVoiceReading}
                            disabled={isVoiceLoading}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors"
                          >
                            {isVoiceLoading ? (
                              <Loader2 className="animate-spin" size={16} />
                            ) : currentAudio ? (
                              <VolumeX size={16} />
                            ) : (
                              <Volume2 size={16} />
                            )}
                            <span className="text-sm">
                              {isVoiceLoading ? 'Loading...' : currentAudio ? 'Stop' : 'Listen'}
                            </span>
                          </button>
                        </div>
                      </div>
                      <div className="text-white leading-8 text-lg space-y-4">
                        {horoscopeData.horoscope.split('\n').map((paragraph, index) => (
                          paragraph.trim() && (
                            <p key={index} className="text-justify">
                              {paragraph.trim()}
                            </p>
                          )
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
