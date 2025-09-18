import React, { useState, useEffect } from 'react';
import { Shield, RefreshCw, Eye, EyeOff, User, AlertCircle, RotateCcw, Zap } from 'lucide-react';
import { 
  getCurrentUserId, 
  generateNewUserId, 
  isIncognitoMode, 
  resetUserSession,
  safeReset,
  nuklearReset
} from '@/utils/userSession';

interface PrivacyControlProps {
  onUserIdChange?: (newUserId: number) => void;
}

const PrivacyControl: React.FC<PrivacyControlProps> = ({ onUserIdChange }) => {
  const [currentUserId, setCurrentUserId] = useState<number>(0);
  const [isIncognito, setIsIncognito] = useState<boolean>(false);
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  useEffect(() => {
    // Async initialization
    const init = async () => {
      const userId = await getCurrentUserId();
      setCurrentUserId(userId);
      
      const incognitoStatus = isIncognitoMode();
      setIsIncognito(incognitoStatus);
      
      if (incognitoStatus && !sessionStorage.getItem('chakrai_privacy_choice_made')) {
        setShowDialog(true);
        sessionStorage.setItem('chakrai_privacy_choice_made', 'true');
      }
    };
    init();
  }, []);

  const handleGenerateNewId = async () => {
    const newId = await generateNewUserId();
    setCurrentUserId(newId);
    setShowDialog(false);
    onUserIdChange?.(newId);
  };

  const handleKeepCurrentId = () => {
    setShowDialog(false);
    onUserIdChange?.(currentUserId);
  };

  const handleResetSession = async () => {
    const newId = await resetUserSession();
    setCurrentUserId(newId);
    onUserIdChange?.(newId);
  };

  const handleSafeReset = async () => {
    if (!confirm('Are you sure you want to start fresh? This will clear all your data but keep your device identity.')) {
      return;
    }
    
    try {
      setIsResetting(true);
      const newId = await safeReset();
      setCurrentUserId(newId);
      onUserIdChange?.(newId);
      setShowDialog(false);
      
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.style.cssText = 'position:fixed;top:20px;right:20px;background:green;color:white;padding:15px;border-radius:8px;z-index:10001;';
      successDiv.textContent = 'âœ… Fresh start complete! Welcome back.';
      document.body.appendChild(successDiv);
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Safe reset failed:', error);
      alert('Reset failed. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleNuclearReset = async () => {
    if (!confirm('ðŸš¨ NUCLEAR RESET ðŸš¨\n\nThis will PERMANENTLY delete ALL your data and device identity. You will start completely fresh as if you never used Chakrai before.\n\nThis cannot be undone. Are you absolutely sure?')) {
      return;
    }
    
    if (!confirm('Last chance! This will delete EVERYTHING. Type "RESET" to confirm you understand this is permanent.') || 
        prompt('Type "RESET" to confirm:') !== 'RESET') {
      return;
    }
    
    try {
      setIsResetting(true);
      await nuklearReset();
      
      // Show final message and reload
      const finalDiv = document.createElement('div');
      finalDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:red;color:white;padding:30px;border-radius:12px;z-index:10002;text-align:center;';
      finalDiv.innerHTML = 'ðŸ’¥ Nuclear reset complete!<br>Reloading in 3 seconds...';
      document.body.appendChild(finalDiv);
      
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
    } catch (error) {
      console.error('Nuclear reset failed:', error);
      alert('Nuclear reset failed. Please try again.');
      setIsResetting(false);
    }
  };

  if (showDialog) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 max-w-md w-full">
          <div className="flex items-center mb-4">
            <Shield className="w-6 h-6 text-blue-400 mr-3" />
            <h3 className="text-xl font-semibold text-white">Privacy Options</h3>
          </div>
          
          <div className="flex items-start mb-4">
            <AlertCircle className="w-5 h-5 text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-white/80 text-sm">
              We detected you're browsing privately. You can continue with your current session ID 
              <span className="font-mono text-blue-300"> #{currentUserId}</span> or generate a completely new one.
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center mb-2">
                <Eye className="w-4 h-4 text-green-400 mr-2" />
                <span className="text-green-300 font-medium text-sm">Continue Current Session</span>
              </div>
              <p className="text-green-200/80 text-xs">
                Keep your current progress and data for this browsing session.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center mb-2">
                <EyeOff className="w-4 h-4 text-purple-400 mr-2" />
                <span className="text-purple-300 font-medium text-sm">Generate New ID</span>
              </div>
              <p className="text-purple-200/80 text-xs">
                Start completely fresh with no connection to previous activity.
              </p>
            </div>
            
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <div className="flex items-center mb-2">
                <RotateCcw className="w-4 h-4 text-orange-400 mr-2" />
                <span className="text-orange-300 font-medium text-sm">Fresh Start</span>
              </div>
              <p className="text-orange-200/80 text-xs">
                Clear all your data but keep device identity. Safe reset.
              </p>
            </div>
            
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center mb-2">
                <Zap className="w-4 h-4 text-red-400 mr-2" />
                <span className="text-red-300 font-medium text-sm">Nuclear Reset</span>
              </div>
              <p className="text-red-200/80 text-xs">
                Delete EVERYTHING. Complete wipe. Cannot be undone.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleKeepCurrentId}
              className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg font-medium transition-colors duration-300 flex items-center justify-center text-sm"
              disabled={isResetting}
            >
              <Eye className="w-4 h-4 mr-1" />
              Continue
            </button>
            <button
              onClick={handleGenerateNewId}
              className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg font-medium transition-colors duration-300 flex items-center justify-center text-sm"
              disabled={isResetting}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              New ID
            </button>
            <button
              onClick={handleSafeReset}
              className="px-3 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 rounded-lg font-medium transition-colors duration-300 flex items-center justify-center text-sm"
              disabled={isResetting}
            >
              {isResetting ? (
                <div className="w-4 h-4 border-2 border-orange-300 border-t-transparent rounded-full animate-spin mr-1" />
              ) : (
                <RotateCcw className="w-4 h-4 mr-1" />
              )}
              Fresh
            </button>
            <button
              onClick={handleNuclearReset}
              className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg font-medium transition-colors duration-300 flex items-center justify-center text-sm"
              disabled={isResetting}
            >
              {isResetting ? (
                <div className="w-4 h-4 border-2 border-red-300 border-t-transparent rounded-full animate-spin mr-1" />
              ) : (
                <Zap className="w-4 h-4 mr-1" />
              )}
              Nuke
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-40">
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center text-white/80 text-sm">
            <User className="w-4 h-4 mr-2" />
            <span className="font-mono">#{currentUserId}</span>
            {isIncognito && (
              <span title="Private browsing detected">
                <Shield className="w-4 h-4 ml-2 text-blue-400" />
              </span>
            )}
          </div>
          
          <button
            onClick={() => setShowDialog(true)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-300 text-white/60 hover:text-white"
            title="Privacy options"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyControl;

