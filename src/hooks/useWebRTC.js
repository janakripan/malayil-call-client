import { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';

export function useWebRTC(username) {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  
  // Call states: 'idle' | 'calling' (outgoing) | 'incoming' | 'connected'
  const [callState, setCallState] = useState('idle');
  const [peerUsername, setPeerUsername] = useState('');
  
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const pendingCandidatesRef = useRef([]);

  // Web Audio Context for generating ringing/dialing sounds
  const audioCtxRef = useRef(null);
  const soundIntervalRef = useRef(null);

  // Initialize Socket.io Connection
  useEffect(() => {
    if (!username) return;

    // Connect to the proxy socket (which forwards to 5000)
    const socketInstance = io({
      autoConnect: true,
      reconnection: true
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('Connected to signaling server');
      socketInstance.emit('register-active-user', username);
    });

    socketInstance.on('online-users-list', (users) => {
      // Filter out self from online users directory
      setOnlineUsers(users.filter(u => u.toLowerCase() !== username.toLowerCase()));
    });

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [username]);

  // Audio Sound Synthesizers
  const startTone = useCallback((type) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const playTone = () => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        if (type === 'dialing') {
          // Outgoing Call sound (440Hz + 480Hz beep for 1 second, every 3 seconds)
          osc1.frequency.value = 440;
          osc2.frequency.value = 480;
          gainNode.gain.setValueAtTime(0, ctx.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.05);
          gainNode.gain.setValueAtTime(0.05, ctx.currentTime + 1.0);
          gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.1);
          osc1.start();
          osc2.start();
          osc1.stop(ctx.currentTime + 1.2);
          osc2.stop(ctx.currentTime + 1.2);
        } else if (type === 'ringing') {
          // Incoming Call sound (double ring: 400Hz + 450Hz beep for 0.4s, 0.2s pause, 0.4s beep, every 3 seconds)
          osc1.frequency.value = 400;
          osc2.frequency.value = 450;
          
          gainNode.gain.setValueAtTime(0, ctx.currentTime);
          
          // First ring
          gainNode.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.05);
          gainNode.gain.setValueAtTime(0.08, ctx.currentTime + 0.45);
          gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
          
          // Second ring
          gainNode.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.7);
          gainNode.gain.setValueAtTime(0.08, ctx.currentTime + 1.1);
          gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.15);

          osc1.start();
          osc2.start();
          osc1.stop(ctx.currentTime + 1.25);
          osc2.stop(ctx.currentTime + 1.25);
        }
      };

      playTone();
      soundIntervalRef.current = setInterval(playTone, 3000);
    } catch (e) {
      console.warn('Audio Tone Generator failed to start:', e);
    }
  }, []);

  const stopTone = useCallback(() => {
    if (soundIntervalRef.current) {
      clearInterval(soundIntervalRef.current);
      soundIntervalRef.current = null;
    }
  }, []);

  // Cleanup helper to fully tear down WebRTC connection
  const cleanupCall = useCallback(() => {
    stopTone();
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    setCallDuration(0);

    // Stop local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);

    // Close peer connection
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    setRemoteStream(null);
    setCallState('idle');
    setPeerUsername('');
    setIsMuted(false);
    pendingCandidatesRef.current = [];
  }, [stopTone]);

  // Setup WebRTC PeerConnection
  const createPeerConnection = useCallback((targetUsername) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('webrtc-ice-candidate', {
          toUsername: targetUsername,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('WebRTC: Remote track received', event.streams[0]);
      setRemoteStream(event.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      console.log(`WebRTC Connection State: ${pc.connectionState}`);
      if (pc.connectionState === 'connected') {
        stopTone();
        setCallState('connected');
        // Start duration timer
        setCallDuration(0);
        durationIntervalRef.current = setInterval(() => {
          setCallDuration(prev => prev + 1);
        }, 1000);
      } else if (
        pc.connectionState === 'disconnected' ||
        pc.connectionState === 'failed' ||
        pc.connectionState === 'closed'
      ) {
        cleanupCall();
      }
    };

    pcRef.current = pc;
    return pc;
  }, [cleanupCall, stopTone]);

  // Capture Microphone stream
  const getLocalUserMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('Failed to get user media (microphone):', err);
      setErrorMessage('Microphone access is required to make calls.');
      cleanupCall();
      throw err;
    }
  }, [cleanupCall]);

  // Outgoing Call Initiation
  const initiateCall = useCallback(async (targetUsername) => {
    if (!socketRef.current) return;
    setErrorMessage('');
    setCallState('calling');
    setPeerUsername(targetUsername);
    startTone('dialing');

    try {
      const stream = await getLocalUserMedia();
      const pc = createPeerConnection(targetUsername);

      // Add local audio tracks to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Create SDP offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketRef.current.emit('call-user', {
        toUsername: targetUsername,
        offerDescription: offer
      });
    } catch (err) {
      console.error('Error initiating call:', err);
    }
  }, [createPeerConnection, getLocalUserMedia, startTone]);

  // Accept Incoming Call
  const acceptIncomingCall = useCallback(async () => {
    if (!socketRef.current || !peerUsername || callState !== 'incoming') return;
    stopTone();
    setErrorMessage('');

    try {
      const stream = await getLocalUserMedia();
      const pc = createPeerConnection(peerUsername);

      // Add local audio tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Process cached remote offer description
      const offerDesc = pendingCandidatesRef.current.offer;
      await pc.setRemoteDescription(new RTCSessionDescription(offerDesc));

      // Add any ice candidates received before description was set
      const candidates = pendingCandidatesRef.current.candidates || [];
      for (const candidate of candidates) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      pendingCandidatesRef.current.candidates = [];

      // Create answer description
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketRef.current.emit('accept-call', {
        toUsername: peerUsername,
        answerDescription: answer
      });

      setCallState('connected');
    } catch (err) {
      console.error('Error accepting call:', err);
      cleanupCall();
    }
  }, [callState, createPeerConnection, getLocalUserMedia, peerUsername, stopTone, cleanupCall]);

  // Decline Incoming Call
  const declineIncomingCall = useCallback(() => {
    if (!socketRef.current || !peerUsername) return;
    socketRef.current.emit('decline-call', { toUsername: peerUsername });
    cleanupCall();
  }, [peerUsername, cleanupCall]);

  // End Current Call
  const endCall = useCallback(() => {
    if (!socketRef.current || !peerUsername) return;
    socketRef.current.emit('hang-up', { toUsername: peerUsername });
    cleanupCall();
  }, [peerUsername, cleanupCall]);

  // Mute microphone
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = !audioTracks[0].enabled;
        setIsMuted(!audioTracks[0].enabled);
      }
    }
  }, []);

  // Listen to Socket events inside call logic
  useEffect(() => {
    if (!socket) return;

    // Incoming Call Handler
    socket.on('incoming-call', ({ fromUsername, offerDescription }) => {
      if (callState !== 'idle') {
        // Line busy - auto-decline incoming calls if already in a call
        socket.emit('decline-call', { toUsername: fromUsername });
        return;
      }
      setCallState('incoming');
      setPeerUsername(fromUsername);
      pendingCandidatesRef.current.offer = offerDescription;
      pendingCandidatesRef.current.candidates = [];
      startTone('ringing');
    });

    // Caller receives Acceptance answer
    socket.on('call-accepted', async ({ answerDescription }) => {
      stopTone();
      const pc = pcRef.current;
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answerDescription));
          
          // Add any queued candidates
          const candidates = pendingCandidatesRef.current.candidates || [];
          for (const candidate of candidates) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
          pendingCandidatesRef.current.candidates = [];
        } catch (err) {
          console.error('Error setting remote description:', err);
        }
      }
    });

    // Caller receives Decline notification
    socket.on('call-declined', () => {
      setErrorMessage('Call was declined or busy.');
      cleanupCall();
    });

    // Other party hung up
    socket.on('call-ended', () => {
      cleanupCall();
    });

    // Relay WebRTC candidates
    socket.on('webrtc-ice-candidate', async ({ candidate }) => {
      const pc = pcRef.current;
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      } else {
        // Cache candidates until remote description is set
        if (!pendingCandidatesRef.current.candidates) {
          pendingCandidatesRef.current.candidates = [];
        }
        pendingCandidatesRef.current.candidates.push(candidate);
      }
    });

    socket.on('call-failed', ({ message }) => {
      setErrorMessage(message);
      cleanupCall();
    });

    return () => {
      socket.off('incoming-call');
      socket.off('call-accepted');
      socket.off('call-declined');
      socket.off('call-ended');
      socket.off('webrtc-ice-candidate');
      socket.off('call-failed');
    };
  }, [socket, callState, cleanupCall, startTone, stopTone]);

  return {
    socket,
    onlineUsers,
    callState,
    peerUsername,
    localStream,
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
  };
}
