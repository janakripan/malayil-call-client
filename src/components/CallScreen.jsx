import React, { useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, Shield, User } from 'lucide-react';

export function CallScreen({
  callState,
  peerUsername,
  remoteStream,
  isMuted,
  callDuration,
  onAccept,
  onDecline,
  onEndCall,
  onToggleMute
}) {
  const remoteAudioRef = useRef(null);

  // Set up the remote audio stream play handler
  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      console.log('CallScreen: Binding remote stream to audio element');
      remoteAudioRef.current.srcObject = remoteStream;
      
      const playPromise = remoteAudioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn('Auto-play of remote stream audio was prevented. Interaction required.', error);
        });
      }
    }
  }, [remoteStream]);

  // Format call duration: seconds -> MM:SS
  const formatTime = (secs) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Helper to generate initials for avatar
  const getInitials = (username) => {
    return username ? username.charAt(0).toUpperCase() : '?';
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/95 flex flex-col justify-between p-8 z-50 overflow-hidden animate-fade-in select-none">
      
      {/* Hidden audio element to play remote peer sound */}
      <audio ref={remoteAudioRef} autoplay playsinline controls={false} className="hidden" />

      {/* Glow effect background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top security reassurance header */}
      <div className="flex justify-center items-center gap-1.5 text-xs text-emerald-400/70 border border-emerald-500/10 bg-emerald-950/20 px-3 py-1.5 rounded-full mx-auto w-fit">
        <Shield className="w-4 h-4" />
        <span>End-to-End Encrypted Data Call</span>
      </div>

      {/* Center avatar & info area */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-6">
        
        {/* Avatar container with ripple rings when dialing/connected */}
        <div className="relative">
          {/* Ripple rings (Ringing or Connected animation) */}
          {(callState === 'calling' || callState === 'incoming' || callState === 'connected') && (
            <>
              <div className="absolute inset-0 rounded-full bg-emerald-500/10 border border-emerald-500/20 animate-ripple-1 scale-[1.5]" />
              <div className="absolute inset-0 rounded-full bg-emerald-500/10 border border-emerald-500/20 animate-ripple-2 scale-[1.8]" />
              <div className="absolute inset-0 rounded-full bg-emerald-500/5 border border-emerald-500/10 animate-ripple-3 scale-[2.2]" />
            </>
          )}
          
          <div className="relative w-32 h-32 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-5xl text-white shadow-2xl z-10">
            {getInitials(peerUsername)}
          </div>
        </div>

        {/* Call Info text */}
        <div className="text-center space-y-2 z-10">
          <h2 className="text-2xl font-extrabold text-white">@{peerUsername}</h2>
          
          {callState === 'calling' && (
            <p className="text-emerald-400 font-semibold text-sm tracking-wider uppercase animate-pulse">
              Calling...
            </p>
          )}
          {callState === 'incoming' && (
            <p className="text-emerald-400 font-semibold text-sm tracking-wider uppercase animate-pulse">
              Incoming Call
            </p>
          )}
          {callState === 'connected' && (
            <div className="space-y-1">
              <p className="text-zinc-400 font-semibold text-xs tracking-wider uppercase">
                Call Connected
              </p>
              <p className="text-3xl font-mono font-bold text-white tracking-wide">
                {formatTime(callDuration)}
              </p>
            </div>
          )}
        </div>

        {/* Dynamic Voice Visual Waves (connected call state) */}
        {callState === 'connected' && (
          <div className="flex items-center gap-1.5 h-8 mt-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <span
                key={i}
                className="w-1 bg-emerald-500/80 rounded-full animate-pulse"
                style={{
                  height: `${Math.floor(Math.random() * 24) + 8}px`,
                  animationDuration: `${0.4 + i * 0.08}s`
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Call Actions Bottom Drawer */}
      <div className="z-10 space-y-8 max-w-sm w-full mx-auto pb-4">
        
        {/* Secondary controls (Mute / Speaker - active call state only) */}
        {callState === 'connected' && (
          <div className="flex items-center justify-center gap-6">
            {/* Mute Button */}
            <button
              onClick={onToggleMute}
              className={`p-4 rounded-full border transition-all duration-200 ${
                isMuted
                  ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:bg-zinc-900'
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Speaker Indicator */}
            <div className="p-4 rounded-full bg-zinc-900/60 border border-zinc-800 text-zinc-400">
              <Volume2 className="w-5 h-5" />
            </div>
          </div>
        )}

        {/* Primary Call Action Buttons (Accept, Decline, Hang-up) */}
        <div className="flex items-center justify-center gap-8">
          
          {/* INCOMING CALL ACTIONS */}
          {callState === 'incoming' && (
            <>
              {/* Decline Button */}
              <button
                onClick={onDecline}
                className="p-5 bg-red-600 hover:bg-red-500 active:scale-95 text-white rounded-full shadow-lg shadow-red-600/20 transition-all flex flex-col items-center justify-center"
              >
                <PhoneOff className="w-7 h-7" />
              </button>

              {/* Accept Button */}
              <button
                onClick={onAccept}
                className="p-5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-full shadow-lg shadow-emerald-600/20 transition-all flex flex-col items-center justify-center"
              >
                <Phone className="w-7 h-7 animate-bounce" />
              </button>
            </>
          )}

          {/* OUTGOING OR CONNECTED CALL ACTIONS */}
          {(callState === 'calling' || callState === 'connected') && (
            <button
              onClick={onEndCall}
              className="p-5 bg-red-600 hover:bg-red-500 active:scale-95 text-white rounded-full shadow-lg shadow-red-600/20 transition-all flex items-center justify-center w-16 h-16"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
          )}

        </div>
      </div>
    </div>
  );
}
