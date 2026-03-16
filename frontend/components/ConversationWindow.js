'use client';
import { useEffect, useRef } from 'react';

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getBadgeClass(intent) {
  const map = {
    order_status: 'badge-intent-order',
    return_request: 'badge-intent-return',
    faq: 'badge-intent-faq',
    complaint: 'badge-intent-complaint',
    unknown: 'badge-intent-unknown',
  };
  return map[intent] || 'badge-intent-unknown';
}

function getBadgeLabel(intent) {
  const map = {
    order_status: '📦 Order',
    return_request: '↩️ Return',
    faq: '❓ FAQ',
    complaint: '😤 Complaint',
    unknown: '🎟️ Escalated',
  };
  return map[intent] || intent;
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 mb-4 bubble-enter">
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 avatar-glow"
        style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
      >
        A
      </div>
      <div className="chat-bubble-ai px-4 py-3">
        <div className="typing-dots">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const isAgent = message.role === 'human-agent';
  const isAI = message.role === 'assistant';

  if (isUser) {
    return (
      <div className="flex items-end justify-end gap-3 mb-4 bubble-enter">
        <div className="max-w-xs lg:max-w-md">
          {/* Intent / sentiment badges */}
          {message.intent && (
            <div className="flex justify-end gap-2 mb-1">
              <span className={`badge ${getBadgeClass(message.intent)}`}>
                {getBadgeLabel(message.intent)}
              </span>
              {message.sentiment && message.sentiment !== 'neutral' && (
                <span className={`badge badge-sentiment-${message.sentiment}`}>
                  {message.sentiment === 'angry' ? '😠 Angry' : message.sentiment === 'positive' ? '😊 Happy' : '😤 Frustrated'}
                </span>
              )}
            </div>
          )}
          <div className="chat-bubble-user px-4 py-3 text-white font-medium">
            <p className="text-sm leading-relaxed">{message.content}</p>
          </div>
          <p className="text-xs mt-1 text-right" style={{ color: '#475569' }}>
            {message.source === 'text' ? '⌨️ Typed' : '🎙️ Voice'} · {formatTime(message.timestamp)}
          </p>
        </div>
        {/* User avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
        >
          U
        </div>
      </div>
    );
  }

  if (isAgent) {
    return (
      <div className="flex items-end gap-3 mb-4 bubble-enter">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
        >
          H
        </div>
        <div className="max-w-xs lg:max-w-md">
          <p className="text-xs mb-1 font-medium" style={{ color: '#34d399' }}>
            {message.agentName || 'Support Agent'} · Human
          </p>
          <div className="chat-bubble-agent px-4 py-3">
            <p className="text-sm leading-relaxed" style={{ color: '#e2e8f0' }}>{message.content}</p>
          </div>
          <p className="text-xs mt-1" style={{ color: '#475569' }}>{formatTime(message.timestamp)}</p>
        </div>
      </div>
    );
  }

  // AI message
  return (
    <div className="flex items-end gap-3 mb-4 bubble-enter">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 avatar-glow"
        style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
      >
        A
      </div>
      <div className="max-w-xs lg:max-w-md">
        {message.ticketId && (
          <div className="ticket-card mb-2">
            <p className="text-xs font-semibold" style={{ color: '#fbbf24' }}>🎟️ Support Ticket Created</p>
            <p className="text-sm font-bold font-mono mt-1" style={{ color: '#f59e0b' }}>{message.ticketId}</p>
          </div>
        )}
        <div className="chat-bubble-ai px-4 py-3">
          <p className="text-sm leading-relaxed" style={{ color: '#cbd5e1' }}>{message.content}</p>
        </div>
        <p className="text-xs mt-1" style={{ color: '#475569' }}>
          Alex · AI Agent · {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}

export default function ConversationWindow({ messages, isTyping }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (messages.length === 0 && !isTyping) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
        <div className="text-6xl opacity-20">💬</div>
        <div className="text-center">
          <p className="font-medium" style={{ color: '#475569' }}>No messages yet</p>
          <p className="text-sm mt-1" style={{ color: '#334155' }}>
            Click the microphone or type below to start
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4 max-w-md w-full">
          {[
            { text: '"Where is my order ORD1001?"', icon: '📦' },
            { text: '"I want to return my headphones"', icon: '↩️' },
            { text: '"What is your return policy?"', icon: '❓' },
            { text: '"My package never arrived!"', icon: '😤' },
          ].map((hint, i) => (
            <div
              key={i}
              className="glass p-3 rounded-xl text-center"
              style={{ border: '1px solid rgba(139,92,246,0.15)' }}
            >
              <span className="text-lg">{hint.icon}</span>
              <p className="text-xs mt-1 italic" style={{ color: '#64748b' }}>{hint.text}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 scroll-container p-4 space-y-1" style={{ overflowY: 'auto' }}>
        {messages.map((msg) => (
          <MessageBubble key={msg.id || msg.timestamp} message={msg} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
