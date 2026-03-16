'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import ConversationWindow from './ConversationWindow';
import MicrophoneButton from './MicrophoneButton';
import StatusIndicator from './StatusIndicator';
import { sendQuery } from '../services/api';

const VOICE_LANG = 'en-US';

export default function VoiceAgent() {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | listening | processing | speaking | error
  const [conversationId, setConversationId] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');

  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const currentUtteranceRef = useRef(null);
  const statusRef = useRef(status);

  // Keep statusRef in sync
  useEffect(() => { statusRef.current = status; }, [status]);

  // ── Initialize Speech Recognition ──────────────────────────────────────────
  const initRecognition = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Please use Chrome.');
      return null;
    }

    const recognition = new SpeechRecognition();
    // Defaulting to auto-detect language based on browser/OS by removing hardcoded lang
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setStatus('listening');
      setError('');
    };

    recognition.onresult = (e) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalTranscript += t;
        else interimTranscript += t;
      }
      setTranscript(finalTranscript || interimTranscript);
      if (finalTranscript) {
        handleSendMessage(finalTranscript.trim(), 'voice');
      }
    };

    recognition.onerror = (e) => {
      if (e.error === 'no-speech') {
        setStatus('idle');
        setTranscript('');
        return;
      }
      console.error('Speech recognition error:', e.error);
      setError(`Microphone error: ${e.error}. Please try again.`);
      setStatus('error');
    };

    recognition.onend = () => {
      if (statusRef.current === 'listening') {
        setStatus('idle');
        setTranscript('');
      }
    };

    return recognition;
  }, []);

  // ── Speak AI Response (TTS) ─────────────────────────────────────────────────
  const speakText = useCallback((text) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = VOICE_LANG;
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    utterance.volume = 1.0;

    // Try to use a natural-sounding voice
    const voices = window.speechSynthesis.getVoices();
    // Prioritize natural voices but don't restrict to English
    const preferred = voices.find(
      (v) => (v.name.includes('Samantha') || v.name.includes('Google') || v.name.includes('Natural'))
    ) || voices[0]; // fallback to first available if no preferred found
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setStatus('speaking');
    utterance.onend = () => {
      setStatus('idle');
      currentUtteranceRef.current = null;
    };
    utterance.onerror = () => {
      setStatus('idle');
      currentUtteranceRef.current = null;
    };

    currentUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  // ── Stop Speech ─────────────────────────────────────────────────────────────
  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      currentUtteranceRef.current = null;
      setStatus('idle');
    }
  }, []);

  // ── Send Message to Backend ────────────────────────────────────────────────
  const handleSendMessage = useCallback(async (text, source = 'text') => {
    if (!text || text.trim().length === 0) return;

    setStatus('processing');
    setTranscript('');

    // Add user message to UI
    const userMsg = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      source,
      id: `user_${Date.now()}`,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const data = await sendQuery(text, conversationId);

      // Set / persist conversation ID
      if (data.conversationId) setConversationId(data.conversationId);

      // Update user message with intent/sentiment
      setMessages((prev) =>
        prev.map((m) =>
          m.id === userMsg.id
            ? { ...m, intent: data.intent, sentiment: data.sentiment }
            : m
        )
      );

      const aiMsg = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
        intent: data.intent,
        sentiment: data.sentiment,
        isEscalated: data.isEscalated,
        ticketId: data.ticketId,
        id: `ai_${Date.now()}`,
      };

      // Delay both written chat and speech so they start at the exact same time
      setTimeout(() => {
        setMessages((prev) => [...prev, aiMsg]);
        setIsTyping(false);
        speakText(data.response);
      }, 1500);
    } catch (err) {
      console.error('Send error:', err);
      setIsTyping(false);
      setStatus('error');
      setError(`Failed to connect to backend: ${err.message}. Is the server running on port 5000?`);

      const errMsg = {
        role: 'assistant',
        content: "I'm having trouble connecting to the server. Please make sure the backend is running and try again.",
        timestamp: new Date().toISOString(),
        id: `err_${Date.now()}`,
      };
      setMessages((prev) => [...prev, errMsg]);
    }
  }, [conversationId, speakText]);

  // ── Mic Button Click Handler ────────────────────────────────────────────────
  const handleMicClick = useCallback(() => {
    // If speaking, interrupt
    if (status === 'speaking') {
      stopSpeaking();
      return;
    }

    // If listening, stop
    if (status === 'listening') {
      recognitionRef.current?.stop();
      setStatus('idle');
      setTranscript('');
      return;
    }

    // Start listening
    if (status === 'idle' || status === 'error') {
      const recognition = initRecognition();
      if (!recognition) return;
      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (e) {
        setError('Could not start microphone. Please check permissions.');
      }
    }
  }, [status, stopSpeaking, initRecognition]);

  // ── Text Input Submit ───────────────────────────────────────────────────────
  const handleTextSubmit = useCallback((e) => {
    e.preventDefault();
    if (!textInput.trim() || status === 'processing') return;
    // Stop any speech first
    if (status === 'speaking') stopSpeaking();
    handleSendMessage(textInput.trim(), 'text');
    setTextInput('');
  }, [textInput, status, handleSendMessage, stopSpeaking]);

  const handleClear = () => {
    stopSpeaking();
    recognitionRef.current?.stop();
    setMessages([]);
    setConversationId(null);
    setStatus('idle');
    setTranscript('');
    setError('');
  };

  return (
    <div className="flex flex-col h-full">

      {/* ── Status Bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-3" style={{ borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
        <StatusIndicator status={status} />
        <div className="flex items-center gap-3">
          {conversationId && (
            <span className="text-xs font-mono" style={{ color: '#334155' }}>
              {conversationId.slice(0, 8)}...
            </span>
          )}
          <button
            onClick={handleClear}
            className="text-xs px-3 py-1.5 rounded-lg transition-all duration-200 hover:opacity-80"
            style={{ background: 'rgba(100,116,139,0.1)', color: '#64748b', border: '1px solid rgba(100,116,139,0.2)' }}
          >
            New Chat
          </button>
        </div>
      </div>

      {/* ── Error Banner ───────────────────────────────────────────────────── */}
      {error && (
        <div className="mx-4 mt-3 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Interim Transcript ─────────────────────────────────────────────── */}
      {transcript && status === 'listening' && (
        <div className="mx-4 mt-2 px-4 py-2 rounded-xl text-sm italic" style={{ background: 'rgba(239,68,68,0.08)', color: '#94a3b8' }}>
          🎙️ {transcript}
        </div>
      )}

      {/* ── Conversation Window ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        <ConversationWindow messages={messages} isTyping={isTyping} />
      </div>

      {/* ── Controls ──────────────────────────────────────────────────────── */}
      <div className="p-4" style={{ borderTop: '1px solid rgba(139,92,246,0.1)' }}>
        {/* Waveform */}
        {(status === 'listening' || status === 'speaking') && (
          <div className="flex justify-center mb-4">
            <div className="waveform">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className={`waveform-bar ${status === 'listening' ? 'active' : ''}`} />
              ))}
            </div>
          </div>
        )}

        {/* Text input + mic button row */}
        <div className="flex items-center gap-3">
          {/* Text input */}
          <form onSubmit={handleTextSubmit} className="flex-1 flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type a message or use microphone..."
              disabled={status === 'processing'}
              className="flex-1 px-4 py-3 rounded-2xl text-sm outline-none transition-all duration-200"
              style={{
                background: 'rgba(26,26,38,0.8)',
                border: '1px solid rgba(139,92,246,0.2)',
                color: '#e2e8f0',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(139,92,246,0.5)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(139,92,246,0.2)')}
            />
            <button
              type="submit"
              disabled={!textInput.trim() || status === 'processing'}
              className="px-5 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: 'white' }}
            >
              Send
            </button>
          </form>

          {/* Mic button */}
          <MicrophoneButton
            status={status}
            onClick={handleMicClick}
            disabled={status === 'processing'}
          />
        </div>

        <p className="text-center text-xs mt-3" style={{ color: '#334155' }}>
          Press mic to speak · Chrome recommended for best voice experience
        </p>
      </div>
    </div>
  );
}
