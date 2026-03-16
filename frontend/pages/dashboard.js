import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { getConversations, sendHumanReply } from '../services/api';

function SentimentEmoji({ sentiment }) {
  const map = { positive: '😊', neutral: '😐', angry: '😠', frustrated: '😤' };
  return <span title={sentiment}>{map[sentiment] || '😐'}</span>;
}

function IntentBadge({ intent }) {
  const config = {
    order_status:   { label: 'Order', cls: 'badge-intent-order' },
    return_request: { label: 'Return', cls: 'badge-intent-return' },
    faq:            { label: 'FAQ', cls: 'badge-intent-faq' },
    complaint:      { label: 'Complaint', cls: 'badge-intent-complaint' },
    unknown:        { label: 'Escalated', cls: 'badge-intent-unknown' },
  };
  const c = config[intent] || config.unknown;
  return <span className={`badge ${c.cls}`}>{c.label}</span>;
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="glass p-4 flex items-center gap-4" style={{ borderRadius: '14px' }}>
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="text-2xl font-bold" style={{ color }}>{value}</p>
        <p className="text-xs" style={{ color: '#64748b' }}>{label}</p>
      </div>
    </div>
  );
}

function ConversationCard({ conv, onTakeOver }) {
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [agentName, setAgentName] = useState('Support Agent');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const lastMsg = conv.messages[conv.messages.length - 1];

  async function handleReply(e) {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await onTakeOver(conv.conversationId, replyText, agentName);
      setSent(true);
      setReplyText('');
      setTimeout(() => setSent(false), 3000);
    } catch {
      alert('Failed to send reply. Please try again.');
    } finally {
      setSending(false);
    }
  }

  const timeAgo = (iso) => {
    const secs = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (secs < 60) return `${secs}s ago`;
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    return `${Math.floor(secs / 3600)}h ago`;
  };

  return (
    <div
      className={`glass glass-hover fade-in ${conv.isEscalated ? 'border-yellow-500/30' : ''}`}
      style={{ borderRadius: '16px', borderColor: conv.isEscalated ? 'rgba(245,158,11,0.3)' : undefined }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ background: conv.isEscalated ? 'linear-gradient(135deg,#f59e0b,#ef4444)' : 'linear-gradient(135deg,#8b5cf6,#6366f1)' }}
          >
            {conv.isEscalated ? '🎟️' : '💬'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white truncate">
                {conv.conversationId.slice(0, 12)}…
              </span>
              {conv.intent && <IntentBadge intent={conv.intent} />}
              {conv.sentiment && <SentimentEmoji sentiment={conv.sentiment} />}
              {conv.isEscalated && (
                <span className="badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}>
                  🎟️ {conv.ticketId}
                </span>
              )}
            </div>
            {lastMsg && (
              <p className="text-xs mt-0.5 truncate" style={{ color: '#64748b' }}>
                {lastMsg.role === 'user' ? '👤' : lastMsg.role === 'human-agent' ? '🧑‍💼' : '🤖'} {lastMsg.content.slice(0, 70)}…
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs" style={{ color: '#334155' }}>
            {timeAgo(conv.updatedAt)} · {conv.messageCount} msgs
          </span>
          <span className="text-slate-500 text-lg">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ borderTop: '1px solid rgba(139,92,246,0.1)' }}>
          {/* Messages */}
          <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
            {conv.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role !== 'user' && (
                  <div
                    className="w-6 h-6 rounded-full text-xs flex items-center justify-center flex-shrink-0 mt-1"
                    style={{
                      background: msg.role === 'human-agent'
                        ? 'linear-gradient(135deg,#10b981,#059669)'
                        : 'linear-gradient(135deg,#8b5cf6,#6366f1)'
                    }}
                  >
                    {msg.role === 'human-agent' ? 'H' : 'A'}
                  </div>
                )}
                <div
                  className={`max-w-xs px-3 py-2 rounded-xl text-xs ${
                    msg.role === 'user'
                      ? 'text-white'
                      : msg.role === 'human-agent'
                      ? ''
                      : ''
                  }`}
                  style={{
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg,#8b5cf6,#6366f1)'
                      : msg.role === 'human-agent'
                      ? 'rgba(16,185,129,0.15)'
                      : 'rgba(26,26,38,0.9)',
                    border: msg.role === 'human-agent' ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(139,92,246,0.15)',
                    color: msg.role === 'user' ? 'white' : '#cbd5e1',
                  }}
                >
                  {msg.role === 'human-agent' && (
                    <p className="font-semibold mb-1" style={{ color: '#34d399' }}>{msg.agentName}</p>
                  )}
                  <p className="leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Human reply form */}
          <form onSubmit={handleReply} className="p-4 space-y-3" style={{ borderTop: '1px solid rgba(139,92,246,0.1)' }}>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}
              >
                👤
              </div>
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="Agent name"
                className="flex-1 px-3 py-1.5 rounded-lg text-sm outline-none"
                style={{ background: 'rgba(26,26,38,0.6)', border: '1px solid rgba(100,116,139,0.2)', color: '#e2e8f0' }}
              />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply as human agent..."
                className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'rgba(26,26,38,0.8)', border: '1px solid rgba(16,185,129,0.2)', color: '#e2e8f0' }}
              />
              <button
                type="submit"
                disabled={sending || !replyText.trim()}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white' }}
              >
                {sending ? '...' : sent ? '✓ Sent' : 'Reply'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState({ conversations: [], stats: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchData = useCallback(async () => {
    try {
      const result = await getConversations();
      setData(result);
      setLastRefresh(new Date());
      setError('');
    } catch (err) {
      setError('Cannot reach backend. Make sure server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleTakeOver = useCallback(async (conversationId, message, agentName) => {
    await sendHumanReply(conversationId, message, agentName);
    await fetchData();
  }, [fetchData]);

  const filtered = data.conversations.filter((c) => {
    if (filter === 'escalated') return c.isEscalated;
    if (filter === 'angry') return c.sentiment === 'angry' || c.sentiment === 'frustrated';
    if (filter === 'active') return !c.isEscalated;
    return true;
  });

  const stats = data.stats || {};

  return (
    <>
      <Head>
        <title>Support Dashboard — ShopEase AI Agent</title>
        <meta name="description" content="Real-time customer support dashboard showing all AI conversations, intents, sentiment analysis, and human escalation management." />
      </Head>

      <main className="bg-radial min-h-screen">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(139,92,246,0.12)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl avatar-glow"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
            >
              📊
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Support Dashboard</h1>
              <p className="text-xs" style={{ color: '#475569' }}>
                {lastRefresh ? `Last updated ${lastRefresh.toLocaleTimeString()}` : 'Loading...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="status-pill" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }}>
              <span className="status-dot active" style={{ background: '#10b981' }} />
              <span className="text-xs font-medium">Live · 8s refresh</span>
            </div>
            <Link
              href="/"
              className="text-sm px-4 py-2 rounded-xl font-medium transition-all hover:opacity-80"
              style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)' }}
            >
              🤖 Voice Agent
            </Link>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
              ⚠️ {error}
            </div>
          )}

          {/* ── Stats ───────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon="💬" label="Total Conversations" value={stats.total || 0} color="#a78bfa" />
            <StatCard icon="✅" label="Active" value={stats.active || 0} color="#34d399" />
            <StatCard icon="🎟️" label="Escalated" value={stats.escalated || 0} color="#fbbf24" />
            <StatCard icon="😠" label="Angry Users" value={(stats.bySentiment?.angry || 0) + (stats.bySentiment?.frustrated || 0)} color="#f87171" />
          </div>

          {/* ── Intent breakdown ─────────────────────────────────────────── */}
          {stats.byIntent && Object.keys(stats.byIntent).length > 0 && (
            <div className="glass p-4" style={{ borderRadius: '16px' }}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: '#94a3b8' }}>Intent Breakdown</h2>
              <div className="flex flex-wrap gap-3">
                {Object.entries(stats.byIntent).map(([intent, count]) => (
                  <div key={intent} className="flex items-center gap-2">
                    <IntentBadge intent={intent} />
                    <span className="text-sm font-bold text-white">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Filter tabs ──────────────────────────────────────────────── */}
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-white mr-2">Conversations</h2>
            {['all', 'active', 'escalated', 'angry'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="text-xs px-3 py-1.5 rounded-lg capitalize font-medium transition-all duration-200"
                style={{
                  background: filter === f ? 'rgba(139,92,246,0.25)' : 'rgba(26,26,38,0.8)',
                  color: filter === f ? '#a78bfa' : '#64748b',
                  border: filter === f ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(100,116,139,0.2)',
                }}
              >
                {f}
              </button>
            ))}
            <button
              onClick={fetchData}
              className="ml-auto text-xs px-3 py-1.5 rounded-lg transition-all duration-200 hover:opacity-80"
              style={{ background: 'rgba(6,182,212,0.1)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.25)' }}
            >
              🔄 Refresh
            </button>
          </div>

          {/* ── Conversation list ────────────────────────────────────────── */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="shimmer h-20 rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass p-12 text-center" style={{ borderRadius: '20px' }}>
              <div className="text-6xl mb-4 opacity-30">📭</div>
              <p className="font-medium" style={{ color: '#475569' }}>No conversations yet</p>
              <p className="text-sm mt-1" style={{ color: '#334155' }}>
                Start a conversation in the Voice Agent to see it here
              </p>
              <Link href="/" className="inline-block mt-4 text-sm px-5 py-2 rounded-xl font-medium" style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', color: 'white' }}>
                Open Voice Agent →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((conv) => (
                <ConversationCard
                  key={conv.conversationId}
                  conv={conv}
                  onTakeOver={handleTakeOver}
                />
              ))}
            </div>
          )}

          <p className="text-center text-xs pb-6" style={{ color: '#1e293b' }}>
            ShopEase AI Customer Support Agent · Built with Next.js &amp; Gemini 2.0 Flash
          </p>
        </div>
      </main>
    </>
  );
}
