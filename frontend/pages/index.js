import Head from 'next/head';
import Link from 'next/link';
import VoiceAgent from '../components/VoiceAgent';

export default function Home() {
  return (
    <>
      <Head>
        <title>AI Customer Support Voice Agent — ShopEase</title>
        <meta
          name="description"
          content="AI-powered voice customer support agent for ShopEase e-commerce. Track orders, process returns, and get instant help."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="bg-radial min-h-screen flex flex-col">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(139,92,246,0.12)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl avatar-glow"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
            >
              🛍️
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text">ShopEase AI Support</h1>
              <p className="text-xs" style={{ color: '#475569' }}>Powered by Gemini 2.0 Flash</p>
            </div>
          </div>

          <nav className="flex items-center gap-3">
            <div className="status-pill" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }}>
              <span className="status-dot active" style={{ background: '#10b981' }} />
              <span className="text-xs font-medium">Live</span>
            </div>
            <Link
              href="/dashboard"
              className="text-sm px-4 py-2 rounded-xl font-medium transition-all duration-200 hover:opacity-80"
              style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)' }}
            >
              📊 Dashboard
            </Link>
          </nav>
        </header>

        {/* ── Two-column layout ─────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden" style={{ minHeight: 0 }}>

          {/* ── Left Panel: Branding / Features ──────────────────────────── */}
          <aside className="lg:w-80 xl:w-96 p-6 flex flex-col gap-6 fade-in" style={{ borderRight: '1px solid rgba(139,92,246,0.1)' }}>

            {/* Hero */}
            <div className="text-center lg:text-left">
              <div className="text-5xl mb-3">🤖</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Meet <span className="gradient-text">Alex</span>
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
                Your AI-powered customer support agent. Available 24/7 to help with orders, returns, and more.
              </p>
            </div>

            {/* Capabilities */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>What I can help with</h3>
              {[
                { icon: '📦', title: 'Order Tracking', desc: 'Track any order in real-time' },
                { icon: '↩️', title: 'Returns & Refunds', desc: 'Initiate returns instantly' },
                { icon: '❓', title: 'Policies & FAQ', desc: 'Shipping, warranties, and more' },
                { icon: '💬', title: 'Complaints', desc: 'Empathetic resolution' },
                { icon: '👤', title: 'Human Escalation', desc: 'Connect with a real agent' },
              ].map((item) => (
                <div key={item.title} className="glass glass-hover flex items-start gap-3 p-3" style={{ borderRadius: '12px' }}>
                  <span className="text-xl mt-0.5">{item.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="text-xs" style={{ color: '#64748b' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Sample orders hint */}
            <div className="glass p-4" style={{ borderRadius: '12px', background: 'rgba(139,92,246,0.05)' }}>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6366f1' }}>
                💡 Try these order IDs
              </h3>
              <div className="grid grid-cols-3 gap-1">
                {['ORD1001', 'ORD1004', 'ORD1008'].map((id) => (
                  <span key={id} className="text-xs font-mono text-center py-1 px-2 rounded-lg" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                    {id}
                  </span>
                ))}
              </div>
            </div>

            {/* Tech stack */}
            <div className="mt-auto">
              <p className="text-xs text-center" style={{ color: '#1e293b' }}>
                Built with Next.js · Express · Gemini 2.0 Flash
              </p>
            </div>
          </aside>

          {/* ── Right Panel: Voice Agent ───────────────────────────────────── */}
          <section className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 glass flex flex-col m-4 overflow-hidden" style={{ borderRadius: '20px', minHeight: 0 }}>
              <VoiceAgent />
            </div>
          </section>

        </div>
      </main>
    </>
  );
}
