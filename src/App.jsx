import React, { useState, useEffect } from 'react';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { CallScreen } from './components/CallScreen';
import { useWebRTC } from './hooks/useWebRTC';
import { X, AlertCircle } from 'lucide-react';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Check for existing session in localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('malayil_call_user');
      const token = localStorage.getItem('malayil_call_token');
      if (storedUser && token) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.warn('Failed to parse stored user session:', e);
      localStorage.removeItem('malayil_call_user');
      localStorage.removeItem('malayil_call_token');
    } finally {
      setInitialLoading(false);
    }
  }, []);

  // WebRTC calling hook
  const {
    onlineUsers,
    callState,
    peerUsername,
    remoteStream,
    isMuted,
    callDuration,
    errorMessage,
    initiateCall,
    acceptIncomingCall,
    declineIncomingCall,
    endCall,
    toggleMute,
    setErrorMessage
  } = useWebRTC(currentUser?.username);

  // Handle successful login
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('malayil_call_user');
    localStorage.removeItem('malayil_call_token');
    setCurrentUser(null);
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-100">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
        <span className="text-sm font-semibold text-zinc-400 mt-4">Loading secure session...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between select-none pb-8">
      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col justify-center">
        {currentUser ? (
          <Dashboard
            currentUser={currentUser}
            onlineUsers={onlineUsers}
            onInitiateCall={initiateCall}
            onLogout={handleLogout}
          />
        ) : (
          <Auth onLoginSuccess={handleLoginSuccess} />
        )}
      </main>

      {/* Floating Error Toast Notification */}
      {errorMessage && (
        <div className="fixed top-6 right-6 max-w-sm w-full bg-red-950/85 border border-red-500/30 rounded-2xl p-4 shadow-xl backdrop-blur-md z-50 animate-fade-in text-white">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-red-400">Call Warning</span>
                <button
                  onClick={() => setErrorMessage('')}
                  className="p-1 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                {errorMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen WebRTC Voice Call Screen overlay */}
      {callState !== 'idle' && (
        <CallScreen
          callState={callState}
          peerUsername={peerUsername}
          remoteStream={remoteStream}
          isMuted={isMuted}
          callDuration={callDuration}
          onAccept={acceptIncomingCall}
          onDecline={declineIncomingCall}
          onEndCall={endCall}
          onToggleMute={toggleMute}
        />
      )}

      {/* Footer Info */}
      <footer className="text-center text-[10px] text-zinc-600 mt-4 px-4">
        © {new Date().getFullYear()} Malayil Call. Data call functionality operates over secure WebRTC connections. No phone numbers are exposed.
      </footer>
    </div>
  );
}

export default App;
