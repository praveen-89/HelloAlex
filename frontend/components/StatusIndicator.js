'use client';
import { useState, useCallback } from 'react';

const STATUS_CONFIG = {
  idle: {
    label: 'Ready to Help',
    icon: '🤖',
    color: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
    textColor: '#a78bfa',
    dotColor: '#8b5cf6',
    pulse: false,
  },
  listening: {
    label: 'Listening...',
    icon: '🎙️',
    color: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    textColor: '#f87171',
    dotColor: '#ef4444',
    pulse: true,
  },
  processing: {
    label: 'Thinking...',
    icon: '🧠',
    color: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
    textColor: '#fbbf24',
    dotColor: '#f59e0b',
    pulse: true,
  },
  speaking: {
    label: 'Speaking',
    icon: '🔊',
    color: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
    textColor: '#34d399',
    dotColor: '#10b981',
    pulse: true,
  },
  error: {
    label: 'Connection Error',
    icon: '⚠️',
    color: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    textColor: '#f87171',
    dotColor: '#ef4444',
    pulse: false,
  },
};

export default function StatusIndicator({ status = 'idle', extraInfo = '' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.idle;

  return (
    <div
      className="status-pill"
      style={{
        background: config.color,
        border: `1px solid ${config.borderColor}`,
        color: config.textColor,
      }}
    >
      <span
        className={`status-dot ${config.pulse ? 'active' : ''}`}
        style={{ background: config.dotColor }}
      />
      <span className="text-sm font-medium">
        {config.icon} {config.label}
        {extraInfo && <span className="ml-1 opacity-70">{extraInfo}</span>}
      </span>
    </div>
  );
}
