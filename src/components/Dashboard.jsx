import React, { useState, useEffect } from 'react';
import { Search, User, LogOut, PhoneCall, RefreshCw, Smartphone, ShieldCheck } from 'lucide-react';

export function Dashboard({ currentUser, onlineUsers, onInitiateCall, onLogout }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // Monitor PWA installation prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    setIsInstallable(false);
    setDeferredPrompt(null);
  };

  // Search logic: Filter online users based on query
  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setFilteredUsers(onlineUsers);
    } else {
      setFilteredUsers(
        onlineUsers.filter(u => u.toLowerCase().includes(query))
      );
    }
  }, [searchQuery, onlineUsers]);

  // Helper to generate initials for avatar
  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Top Navigation Bar */}
      <header className="glass rounded-2xl p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-white leading-tight">Malayil Call</h2>
            <p className="text-[10px] text-zinc-500 font-medium tracking-wide uppercase">Secure PWA</p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-sm font-semibold text-white">{currentUser.displayName}</span>
            <span className="text-xs text-zinc-400">@{currentUser.username}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-sm">
            {getInitials(currentUser.displayName)}
          </div>
          <button
            onClick={onLogout}
            className="p-2 rounded-xl bg-zinc-900/50 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors border border-zinc-800 hover:border-red-500/20"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* PWA Install Banner */}
      {isInstallable && (
        <div className="glass-emerald rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-400">Install Malayil Call App</h3>
              <p className="text-xs text-zinc-300">Add to your home screen for offline access and native voice calling experience.</p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition-all text-white text-xs font-semibold rounded-lg shadow-md"
          >
            Install Now
          </button>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Profile Card & Info */}
        <div className="md:col-span-1 glass rounded-3xl p-6 h-fit space-y-6 shadow-lg">
          <div className="text-center space-y-3">
            <div className="inline-flex w-20 h-20 rounded-full bg-emerald-600/15 border border-emerald-500/30 text-emerald-400 items-center justify-center font-bold text-3xl shadow-inner">
              {getInitials(currentUser.displayName)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{currentUser.displayName}</h3>
              <p className="text-sm text-zinc-400">@{currentUser.username}</p>
            </div>
          </div>

          <div className="border-t border-zinc-800/80 pt-4 space-y-3">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">Registered Number</span>
              <span className="text-sm font-mono text-zinc-300">{currentUser.phoneNumber}</span>
            </div>
            <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800 text-[11px] text-zinc-400 leading-relaxed">
              🛡️ your phone number is <strong>private</strong>. Other users can only search and call you via your username.
            </div>
          </div>
        </div>

        {/* Calling Directory */}
        <div className="md:col-span-2 glass rounded-3xl p-6 shadow-lg space-y-5">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h2 className="text-xl font-bold text-white">Call Directory</h2>
              <p className="text-xs text-zinc-400">Search and call online users using data. No phone numbers exposed.</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 bg-zinc-900/50 px-2.5 py-1.5 rounded-lg border border-zinc-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping-slow" />
              <span>{onlineUsers.length} Users Online</span>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-emerald-500 transition-colors">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 rounded-xl outline-none text-white transition-all placeholder:text-zinc-600"
            />
          </div>

          {/* Users List */}
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-zinc-800 rounded-2xl">
                <span className="text-zinc-600 block text-2xl mb-2">👥</span>
                <span className="text-sm text-zinc-500">
                  {searchQuery ? 'No online users match your search.' : 'Waiting for other users to come online...'}
                </span>
                <p className="text-xs text-zinc-600 mt-1 max-w-xs mx-auto">
                  Open another tab or browser in private mode and login with a different number to test calling!
                </p>
              </div>
            ) : (
              filteredUsers.map((username) => (
                <div
                  key={username}
                  className="flex items-center justify-between p-4 bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-850 hover:border-zinc-800 rounded-2xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                        {getInitials(username)}
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-zinc-900 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                        @{username}
                      </span>
                      <span className="text-[10px] text-zinc-500 block">Available</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onInitiateCall(username)}
                    className="p-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all text-white rounded-xl shadow-md shadow-emerald-600/10 flex items-center gap-1.5 text-xs font-semibold"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Call</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
