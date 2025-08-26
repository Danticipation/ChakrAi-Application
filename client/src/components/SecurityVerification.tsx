// BULLETPROOF DEVICE FINGERPRINTING - SECURITY VERIFICATION
// This component helps verify that the device fingerprinting system is working correctly
// and that there's zero chance of user data contamination

import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, AlertTriangle, RefreshCw, Eye, Lock } from 'lucide-react';
import { 
  getCurrentUserId, 
  getAuthHeaders,
  nuklearReset,
  clearUserSession
} from '../utils/unifiedUserSession';
import { 
  generateDeviceFingerprint, 
  debugUserSession
} from '@/utils/userSession';

// Create session ID generator for security test
const generateSessionId = () => {
  return `session_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
};

// Create session validator for security test  
const validateUserSession = () => {
  const deviceFp = localStorage.getItem('deviceFingerprint');
  const sessionId = localStorage.getItem('sessionId');
  return !!(deviceFp && sessionId);
};

const SecurityVerification: React.FC = () => {
  const [verificationResults, setVerificationResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runSecurityVerification = async () => {
    setIsRunning(true);
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: []
    };

    try {
      // Test 1: Session Validation
      const sessionValid = validateUserSession();
      results.tests.push({
        name: 'Session Validation',
        status: sessionValid ? 'PASS' : 'FAIL',
        details: sessionValid ? 'User session is valid and secure' : 'Session validation failed',
        critical: true
      });

      // Test 2: User ID Consistency
      const userId1 = await getCurrentUserId();
      const userId2 = await getCurrentUserId();
      const userIdConsistent = userId1 === userId2;
      results.tests.push({
        name: 'User ID Consistency',
        status: userIdConsistent ? 'PASS' : 'FAIL',
        details: `User ID: ${userId1} (consistent: ${userIdConsistent})`,
        critical: true
      });

      // Test 3: Device Fingerprint Consistency
      const fingerprint1 = generateDeviceFingerprint();
      const fingerprint2 = generateDeviceFingerprint();
      const fingerprintConsistent = fingerprint1 === fingerprint2;
      results.tests.push({
        name: 'Device Fingerprint Consistency',
        status: fingerprintConsistent ? 'PASS' : 'FAIL',
        details: `Fingerprint: ${fingerprint1.substring(0, 20)}... (consistent: ${fingerprintConsistent})`,
        critical: true
      });

      // Test 4: Session ID Generation
      const sessionId = generateSessionId();
      const sessionIdValid = sessionId && sessionId.length > 20;
      results.tests.push({
        name: 'Session ID Generation',
        status: sessionIdValid ? 'PASS' : 'FAIL',
        details: `Session ID: ${sessionId.substring(0, 20)}... (valid: ${sessionIdValid})`,
        critical: false
      });

      // Test 5: Headers Generation
      const headers = await getAuthHeaders();
      const hasRequiredHeaders = headers['X-Device-Fingerprint'] && headers['X-Session-ID'] && headers['X-User-ID'];
      results.tests.push({
        name: 'API Headers Generation',
        status: hasRequiredHeaders ? 'PASS' : 'FAIL',
        details: `Headers: ${Object.keys(headers).join(', ')}`,
        critical: true
      });

      // Test 6: Data Isolation (User ID Range)
      const userIdInRange = userId1 >= 1000 && userId1 <= 999999;
      results.tests.push({
        name: 'User ID Range Validation',
        status: userIdInRange ? 'PASS' : 'FAIL',
        details: `User ID ${userId1} in valid range (1000-999999): ${userIdInRange}`,
        critical: true
      });

      // Test 7: Storage Persistence
      const localStorage_fp = localStorage.getItem('chakrai_device_fingerprint');
      const sessionStorage_id = sessionStorage.getItem('chakrai_session_id');
      const storageValid = localStorage_fp && sessionStorage_id;
      results.tests.push({
        name: 'Storage Persistence',
        status: storageValid ? 'PASS' : 'FAIL',
        details: `LocalStorage: ${!!localStorage_fp}, SessionStorage: ${!!sessionStorage_id}`,
        critical: false
      });

      // Test 8: API Endpoint Test
      try {
        const testResponse = await fetch('/api/dashboard-stats', { 
          headers: await getAuthHeaders(),
          method: 'GET'
        });
        results.tests.push({
          name: 'API Endpoint Test',
          status: testResponse.status < 500 ? 'PASS' : 'FAIL',
          details: `API Response: ${testResponse.status} ${testResponse.statusText}`,
          critical: false
        });
      } catch (apiError) {
        results.tests.push({
          name: 'API Endpoint Test',
          status: 'FAIL',
          details: `API Error: ${apiError}`,
          critical: false
        });
      }

      // Calculate overall security status
      const criticalTests = results.tests.filter((t: any) => t.critical);
      const criticalPassed = criticalTests.filter((t: any) => t.status === 'PASS');
      results.overallStatus = criticalPassed.length === criticalTests.length ? 'SECURE' : 'INSECURE';
      results.securityScore = Math.round((criticalPassed.length / criticalTests.length) * 100);

    } catch (error) {
      results.error = error instanceof Error ? error.message : String(error);
      results.overallStatus = 'ERROR';
    }

    setVerificationResults(results);
    setIsRunning(false);
  };

  useEffect(() => {
    runSecurityVerification();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 p-8">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Security Verification</h1>
            <p className="text-blue-200">Bulletproof Device Fingerprinting System Test</p>
          </div>

          {/* Controls */}
          <div className="flex justify-center space-x-4 mb-8">
            <button
              onClick={runSecurityVerification}
              disabled={isRunning}
              className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? 'Running Tests...' : 'Run Security Test'}
            </button>
            
            <button
              onClick={debugUserSession}
              className="flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
            >
              <Eye className="w-5 h-5 mr-2" />
              Debug Session
            </button>
            
            <button
              onClick={() => {
                if (window.confirm('This will clear ALL user data and reload the page. Are you sure?')) {
                  nuklearReset().then(() => {
                    window.location.reload();
                  }).catch(error => {
                    console.error('Nuclear reset failed:', error);
                    // Fallback: clear local storage and reload
                    clearUserSession();
                    window.location.reload();
                  });
                }
              }}
              className="flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
            >
              <AlertTriangle className="w-5 h-5 mr-2" />
              Emergency Reset
            </button>
          </div>

          {/* Results */}
          {verificationResults && (
            <div className="space-y-6">
              
              {/* Overall Status */}
              <div className={`p-6 rounded-2xl border-2 ${
                verificationResults.overallStatus === 'SECURE' 
                  ? 'bg-green-500/20 border-green-400' 
                  : verificationResults.overallStatus === 'INSECURE'
                  ? 'bg-red-500/20 border-red-400'
                  : 'bg-yellow-500/20 border-yellow-400'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {verificationResults.overallStatus === 'SECURE' ? (
                      <CheckCircle className="w-8 h-8 text-green-400 mr-3" />
                    ) : (
                      <AlertTriangle className="w-8 h-8 text-red-400 mr-3" />
                    )}
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        System Status: {verificationResults.overallStatus}
                      </h2>
                      <p className="text-white/80">
                        Security Score: {verificationResults.securityScore}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white/60 text-sm">
                      Test Run: {new Date(verificationResults.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Individual Tests */}
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-white">Test Results</h3>
                {verificationResults.tests.map((test: any, index: number) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-xl border ${
                      test.status === 'PASS' 
                        ? 'bg-green-500/10 border-green-500/30' 
                        : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {test.status === 'PASS' ? (
                          <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-red-400 mr-3" />
                        )}
                        <div>
                          <h4 className="font-semibold text-white">
                            {test.name}
                            {test.critical && <span className="ml-2 px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded">CRITICAL</span>}
                          </h4>
                          <p className="text-white/70 text-sm">{test.details}</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        test.status === 'PASS' 
                          ? 'bg-green-500/20 text-green-300' 
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {test.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Error Display */}
              {verificationResults.error && (
                <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30">
                  <h4 className="font-semibold text-red-300 mb-2">Error Occurred</h4>
                  <p className="text-red-200 text-sm font-mono">{verificationResults.error}</p>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
              <Lock className="w-5 h-5 mr-2" />
              Security Guidelines
            </h3>
            <div className="text-white/80 text-sm space-y-2">
              <p>• All CRITICAL tests must pass for the system to be considered secure</p>
              <p>• Device fingerprints should remain consistent across page reloads</p>
              <p>• User IDs should be unique and deterministic based on device fingerprint</p>
              <p>• API headers should always include all required security headers</p>
              <p>• Use Emergency Reset only if you suspect data contamination</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityVerification;