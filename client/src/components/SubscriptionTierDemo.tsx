import React, { useState } from 'react';

interface AnalysisResult {
  success: boolean;
  tier: string;
  analysis?: any;
  subscription?: any;
  error?: string;
  message?: string;
  upgradeOptions?: any[];
}

const SubscriptionTierDemo: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<number>(1); // 1=free, 2=premium, 3=professional
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const userTypes = {
    1: { name: 'Free User', tier: 'free', color: 'bg-gray-100' },
    2: { name: 'Premium User', tier: 'premium', color: 'bg-blue-100' },
    3: { name: 'Professional User', tier: 'professional', color: 'bg-purple-100' }
  };

  const testBasicAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tiered-analysis/basic-analysis/${currentUser}`);
      const result = await response.json();
      setAnalysisResult(result);
    } catch (error) {
      setAnalysisResult({
        success: false,
        tier: 'error',
        error: 'Failed to fetch analysis'
      });
    }
    setLoading(false);
  };

  const testPremiumAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tiered-analysis/premium-analysis/${currentUser}`);
      const result = await response.json();
      setAnalysisResult(result);
    } catch (error) {
      setAnalysisResult({
        success: false,
        tier: 'error',
        error: 'Failed to fetch analysis'
      });
    }
    setLoading(false);
  };

  const testSmartAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tiered-analysis/smart-analysis/${currentUser}`);
      const result = await response.json();
      setAnalysisResult(result);
    } catch (error) {
      setAnalysisResult({
        success: false,
        tier: 'error',
        error: 'Failed to fetch analysis'
      });
    }
    setLoading(false);
  };

  const getSubscriptionStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tiered-analysis/subscription-status/${currentUser}`);
      const result = await response.json();
      setAnalysisResult(result);
    } catch (error) {
      setAnalysisResult({
        success: false,
        tier: 'error',
        error: 'Failed to fetch subscription status'
      });
    }
    setLoading(false);
  };

  const getPremiumPreview = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tiered-analysis/premium-preview/${currentUser}`);
      const result = await response.json();
      setAnalysisResult(result);
    } catch (error) {
      setAnalysisResult({
        success: false,
        tier: 'error',
        error: 'Failed to fetch premium preview'
      });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          ðŸŽ¯ Subscription Tier Testing Dashboard
        </h1>
        
        {/* User Selector */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Select Test User:</h2>
          <div className="flex gap-4">
            {Object.entries(userTypes).map(([userId, user]) => (
              <button
                key={userId}
                onClick={() => setCurrentUser(Number(userId))}
                className={`px-4 py-2 rounded-lg border-2 ${
                  currentUser === Number(userId)
                    ? 'border-blue-500 ' + user.color
                    : 'border-gray-300 bg-white'
                } transition-all`}
              >
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-gray-600">{user.tier}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Test Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={testBasicAnalysis}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
          >
            ðŸ†“ Test Basic Analysis
          </button>
          
          <button
            onClick={testPremiumAnalysis}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            ðŸ’Ž Test Premium Analysis
          </button>
          
          <button
            onClick={testSmartAnalysis}
            disabled={loading}
            className="bg-purple-500 text-white px-4 py-3 rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
          >
            ðŸŽ¯ Test Smart Analysis
          </button>
          
          <button
            onClick={getSubscriptionStatus}
            disabled={loading}
            className="bg-gray-500 text-white px-4 py-3 rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            ðŸ“Š Subscription Status
          </button>
          
          <button
            onClick={getPremiumPreview}
            disabled={loading}
            className="bg-orange-500 text-white px-4 py-3 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            ðŸŽ¨ Premium Preview
          </button>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">Processing...</p>
          </div>
        )}

        {/* Results Display */}
        {analysisResult && !loading && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">
              Results for {userTypes[currentUser as keyof typeof userTypes].name}:
            </h3>
            
            {analysisResult.success ? (
              <div className="space-y-4">
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                  âœ… Request successful! Tier: <strong>{analysisResult.tier}</strong>
                </div>
                
                {/* Analysis Results */}
                {analysisResult.analysis && (
                  <div className="bg-white p-4 rounded border">
                    <h4 className="font-semibold mb-2">Analysis Results:</h4>
                    {analysisResult.analysis.basicProfile && (
                      <div>
                        <p><strong>Personality Type:</strong> {analysisResult.analysis.basicProfile.personalityType}</p>
                        <p><strong>Top Traits:</strong> {analysisResult.analysis.basicProfile.topTraits?.join(', ')}</p>
                        <p><strong>Key Insight:</strong> {analysisResult.analysis.basicProfile.oneInsight}</p>
                      </div>
                    )}
                    {analysisResult.analysis.overallProfile && (
                      <div>
                        <p><strong>Comprehensive Analysis Available!</strong></p>
                        <p><strong>Insights Generated:</strong> {analysisResult.analysis.dataPoints?.totalInsights || 'Many'}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Subscription Info */}
                {analysisResult.subscription && (
                  <div className="bg-blue-50 p-4 rounded border">
                    <h4 className="font-semibold mb-2">Subscription Info:</h4>
                    <p><strong>Current Tier:</strong> {analysisResult.subscription.currentTier}</p>
                    {analysisResult.subscription.usage && (
                      <p><strong>Usage:</strong> {analysisResult.subscription.usage.remaining} of {analysisResult.subscription.usage.limit} remaining</p>
                    )}
                  </div>
                )}

                {/* Upgrade Options */}
                {analysisResult.upgradeOptions && (
                  <div className="bg-yellow-50 p-4 rounded border">
                    <h4 className="font-semibold mb-2">Available Upgrades:</h4>
                    {analysisResult.upgradeOptions.map((option: any, index: number) => (
                      <div key={index} className="mb-2">
                        <strong>{option.name}</strong> - ${option.price}/month
                        <br />
                        <small className="text-gray-600">{option.benefits?.join(', ')}</small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  âŒ Request failed or access denied
                </div>
                
                {analysisResult.error && (
                  <div className="bg-gray-100 p-4 rounded">
                    <strong>Error:</strong> {analysisResult.error}
                  </div>
                )}
                
                {analysisResult.message && (
                  <div className="bg-blue-100 p-4 rounded">
                    <strong>Message:</strong> {analysisResult.message}
                  </div>
                )}

                {/* Show upgrade options even on error */}
                {analysisResult.upgradeOptions && (
                  <div className="bg-yellow-50 p-4 rounded border">
                    <h4 className="font-semibold mb-2">Upgrade Required:</h4>
                    {analysisResult.upgradeOptions.map((option: any, index: number) => (
                      <div key={index} className="mb-2">
                        <strong>{option.name}</strong> - ${option.price}/month
                        <br />
                        <small className="text-gray-600">{option.benefits?.join(', ')}</small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Raw Response (for debugging) */}
            <details className="mt-4">
              <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                ðŸ” View Raw Response (for debugging)
              </summary>
              <pre className="mt-2 bg-gray-100 p-4 rounded text-xs overflow-auto">
                {JSON.stringify(analysisResult, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>

      {/* Feature Comparison Table */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Subscription Tiers Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left">Feature</th>
                <th className="border border-gray-300 px-4 py-2">Free</th>
                <th className="border border-gray-300 px-4 py-2">Premium ($9.99)</th>
                <th className="border border-gray-300 px-4 py-2">Professional ($29.99)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-2 font-medium">Personality Traits</td>
                <td className="border border-gray-300 px-4 py-2 text-center">10 basic</td>
                <td className="border border-gray-300 px-4 py-2 text-center">190+ dimensions</td>
                <td className="border border-gray-300 px-4 py-2 text-center">190+ dimensions</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 px-4 py-2 font-medium">Psychological Domains</td>
                <td className="border border-gray-300 px-4 py-2 text-center">Overview</td>
                <td className="border border-gray-300 px-4 py-2 text-center">9 comprehensive</td>
                <td className="border border-gray-300 px-4 py-2 text-center">9 comprehensive</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2 font-medium">Monthly Analyses</td>
                <td className="border border-gray-300 px-4 py-2 text-center">1</td>
                <td className="border border-gray-300 px-4 py-2 text-center">Unlimited</td>
                <td className="border border-gray-300 px-4 py-2 text-center">Unlimited</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 px-4 py-2 font-medium">Therapeutic Recommendations</td>
                <td className="border border-gray-300 px-4 py-2 text-center">Basic tips</td>
                <td className="border border-gray-300 px-4 py-2 text-center">Clinical-grade</td>
                <td className="border border-gray-300 px-4 py-2 text-center">Clinical-grade</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2 font-medium">Progress Tracking</td>
                <td className="border border-gray-300 px-4 py-2 text-center">âŒ</td>
                <td className="border border-gray-300 px-4 py-2 text-center">âœ…</td>
                <td className="border border-gray-300 px-4 py-2 text-center">âœ…</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 px-4 py-2 font-medium">Clinical Reporting</td>
                <td className="border border-gray-300 px-4 py-2 text-center">âŒ</td>
                <td className="border border-gray-300 px-4 py-2 text-center">âŒ</td>
                <td className="border border-gray-300 px-4 py-2 text-center">âœ…</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionTierDemo;
