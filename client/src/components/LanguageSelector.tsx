import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Volume2, CheckCircle, AlertCircle } from 'lucide-react';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  voiceSupport: boolean;
  completeness: number;
}

interface LanguageSelectorProps {
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
  showFullSelector?: boolean;
}

export function LanguageSelector({ 
  currentLanguage, 
  onLanguageChange, 
  showFullSelector = false 
}: LanguageSelectorProps) {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingVoice, setTestingVoice] = useState<string | null>(null);

  useEffect(() => {
    fetchSupportedLanguages();
  }, []);

  const fetchSupportedLanguages = async () => {
    try {
      const response = await fetch('/api/internationalization/languages');
      if (response.ok) {
        const data = await response.json();
        setLanguages(data.languages);
      }
    } catch (error) {
      console.error('Failed to fetch supported languages:', error);
      // Fallback languages
      setLanguages([
        { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr', voiceSupport: true, completeness: 100 },
        { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr', voiceSupport: true, completeness: 95 },
        { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr', voiceSupport: true, completeness: 90 },
        { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr', voiceSupport: true, completeness: 85 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const testLanguageVoice = async (languageCode: string) => {
    try {
      setTestingVoice(languageCode);
      const language = languages.find(l => l.code === languageCode);
      const testMessage = getTestMessage(languageCode);
      
      const response = await fetch('/api/internationalization/test-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testMessage,
          language: languageCode
        })
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play().catch(console.error);
      }
    } catch (error) {
      console.error('Failed to test voice:', error);
    } finally {
      setTestingVoice(null);
    }
  };

  const getTestMessage = (languageCode: string): string => {
    const messages = {
      en: "Hello, this is a test of the voice in English for your mental wellness journey.",
      es: "Hola, esta es una prueba de la voz en español para tu viaje de bienestar mental.",
      fr: "Bonjour, ceci est un test de la voix en français pour votre parcours de bien-être mental.",
      de: "Hallo, dies ist ein Test der Stimme auf Deutsch für Ihre mentale Wellness-Reise.",
      pt: "Olá, este é um teste da voz em português para sua jornada de bem-estar mental.",
      it: "Ciao, questo è un test della voce in italiano per il tuo percorso di benessere mentale.",
      zh: "你好，这是中文语音测试，为您的心理健康之旅服务。",
      ja: "こんにちは、これは日本語の音声テストです。あなたの心の健康の旅のために。",
      ko: "안녕하세요, 이것은 정신 건강 여정을 위한 한국어 음성 테스트입니다."
    };
    return messages[languageCode as keyof typeof messages] || messages.en;
  };

  const getCompletenessColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-100 text-green-800';
    if (percentage >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const handleLanguageChange = async (newLanguage: string) => {
    try {
      // Apply language immediately to DOM
      document.documentElement.lang = newLanguage;
      document.documentElement.dir = languages.find(l => l.code === newLanguage)?.direction || 'ltr';
      
      onLanguageChange(newLanguage);
      
      // Save language preference
      await fetch('/api/internationalization/set-language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: newLanguage })
      });
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!showFullSelector) {
    // Simple dropdown version
    return (
      <div className="flex items-center space-x-2">
        <Globe className="w-4 h-4 text-gray-500" />
        <Select value={currentLanguage} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {languages.map(lang => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.nativeName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Full selector with language cards
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Choose Your Language</h2>
        <p className="text-gray-600">Select the language for your therapeutic journey</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {languages.map(language => (
          <Card 
            key={language.code}
            className={`cursor-pointer transition-all hover:shadow-md ${
              currentLanguage === language.code 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleLanguageChange(language.code)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{language.nativeName}</CardTitle>
                  <p className="text-sm text-gray-600">{language.name}</p>
                </div>
                {currentLanguage === language.code && (
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Translation Completeness */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Translation</span>
                <Badge className={getCompletenessColor(language.completeness)}>
                  {language.completeness}%
                </Badge>
              </div>

              {/* Voice Support */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <Volume2 className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">Voice</span>
                </div>
                <div className="flex items-center space-x-2">
                  {language.voiceSupport ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  {language.voiceSupport && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        testLanguageVoice(language.code);
                      }}
                      disabled={testingVoice === language.code}
                      className="h-6 px-2 text-xs"
                    >
                      {testingVoice === language.code ? 'Testing...' : 'Test'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Direction Support */}
              {language.direction === 'rtl' && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Text Direction</span>
                  <Badge variant="outline" className="text-xs">
                    Right-to-Left
                  </Badge>
                </div>
              )}

              {/* Therapeutic Features */}
              <div className="text-xs text-gray-600">
                <p>✓ Therapeutic terminology</p>
                <p>✓ Cultural adaptation</p>
                {language.voiceSupport && <p>✓ Emotional voice tones</p>}
                {language.completeness >= 90 && <p>✓ Complete interface</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Language Information */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Globe className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">Language Support Information</p>
              <ul className="space-y-1 text-xs">
                <li>• All therapeutic content is professionally translated for cultural sensitivity</li>
                <li>• Voice support includes emotionally responsive tones adapted to each language</li>
                <li>• Emergency resources are localized for your region when available</li>
                <li>• Language preferences sync across devices for consistent experience</li>
                <li>• New languages are regularly added based on community needs</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}