import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, Lock, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { apiClient } from '../services/apiClient';

export function HomePage() {
  const navigate = useNavigate();

  // Form state
  const [url, setUrl] = useState('');
  const [maxDepth, setMaxDepth] = useState(3);
  const [authHeader, setAuthHeader] = useState('');
  const [enableVuln, setEnableVuln] = useState(true);
  const [enableBias, setEnableBias] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setError('');
    setLoading(true);
    try {
      const authHeaders: Record<string, string> = {};
      if (authHeader.trim()) {
        const [key, ...rest] = authHeader.split(':');
        if (key && rest.length > 0) {
          authHeaders[key.trim()] = rest.join(':').trim();
        }
      }
      const response = await apiClient.startScan({
        targetUrl: url.trim(),
        options: {
          enableBiasDetection: enableBias,
          enableVulnTesting: enableVuln,
          maxDepth,
          ...(Object.keys(authHeaders).length > 0 ? { authHeaders } : {}),
        },
      });
      navigate(`/scan/${response.scanId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start scan');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: 'visibility_off',
      title: 'Zero-Knowledge Testing',
      desc: 'Perform deep audits without providing source code or internal system documentation. We test what the world sees.',
    },
    {
      icon: 'bug_report',
      title: 'Vulnerability Detection',
      desc: 'Real-time identification of XSS, SQLi, and logic flaws using Gemini-driven payload generation.',
    },
    {
      icon: 'balance',
      title: 'Bias Analysis',
      desc: 'Audit your integrated AI models for harmful biases, stereotypes, and non-deterministic behavior shifts.',
    },
    {
      icon: 'psychology',
      title: 'AI-Powered Reasoning',
      desc: 'Move beyond regex. Our engine understands context to eliminate false positives and explain "The Why".',
    },
  ];

  const steps = [
    { num: '01', title: 'Recon', desc: 'Autonomous mapping of attack surface.' },
    { num: '02', title: 'Analysis', desc: 'Contextual intent extraction by Gemini.' },
    { num: '03', title: 'Execution', desc: 'Controlled vulnerability fuzzing.' },
    { num: '04', title: 'Bias Probe', desc: 'Testing AI outputs for deviations.' },
    { num: '05', title: 'Intelligence', desc: 'Actionable remediation reports.' },
  ];

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-12">

      {/* ── Hero ── */}
      <section className="text-center mb-16 space-y-6">
        <h1 className="text-5xl md:text-6xl font-bold text-white uppercase tracking-tighter leading-tight">
          Expose What's Hidden
        </h1>
        <p className="text-base text-neutral-400 max-w-2xl mx-auto leading-relaxed">
          CERBERUS-AI autonomously crawls your application, tests for vulnerabilities, and detects AI bias — powered by Google Gemini.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {[
            { color: 'bg-green-500', label: 'Zero Source Code Needed' },
            { color: 'bg-red-600', label: 'AI-Classified Threats' },
            { color: 'bg-purple-500', label: 'Bias Detection Engine' },
          ].map(({ color, label }) => (
            <span
              key={label}
              className="px-3 py-1 bg-[#202020] border border-[#5c403c] text-[#e5e2e1] rounded flex items-center gap-2"
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em' }}
            >
              <span className={`w-1.5 h-1.5 ${color} rounded-full`} />
              {label}
            </span>
          ))}
        </div>
      </section>

      {/* ── Scan Form Card ── */}
      <section className="max-w-[640px] mx-auto mb-16">
        <div className="bg-[#111111] border-t-2 border-red-600 border-x border-b border-[#5c403c]/30 p-6 relative overflow-hidden">
          {/* scanline overlay */}
          <div className="scanline absolute inset-0 pointer-events-none opacity-20" />

          <h2 className="text-2xl font-semibold text-white mb-6 uppercase flex items-center gap-2 tracking-tight">
            <Terminal className="w-5 h-5 text-red-600" />
            Start a New Audit
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {/* Target URL */}
            <div className="space-y-1">
              <label className="label-caps">Target URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.your-system.io"
                className="input-field"
                required
                disabled={loading}
                aria-label="Target URL"
              />
            </div>

            {/* Advanced Settings Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-neutral-500 hover:text-neutral-200 transition-colors duration-200 group"
            >
              <Settings className="w-4 h-4 group-hover:text-red-500 transition-colors" />
              <span className="label-caps text-neutral-500 group-hover:text-neutral-200">
                Advanced Settings
              </span>
              {showAdvanced
                ? <ChevronUp className="w-3.5 h-3.5" />
                : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Advanced Panel */}
            {showAdvanced && (
              <div className="space-y-6 border border-[#5c403c]/40 bg-[#0d0d0d] p-4">
                {/* Crawl Depth */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="label-caps">Max Crawl Depth</label>
                    <span className="font-mono text-xs text-red-600">Level {maxDepth}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={maxDepth}
                    onChange={(e) => setMaxDepth(Number(e.target.value))}
                    className="w-full h-1 bg-neutral-800 appearance-none cursor-pointer"
                  />
                </div>

                {/* Auth Header */}
                <div className="space-y-1">
                  <label className="label-caps">Auth Header (Optional)</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-4 h-4 text-neutral-500" />
                    <input
                      type="password"
                      value={authHeader}
                      onChange={(e) => setAuthHeader(e.target.value)}
                      placeholder="Bearer *****************"
                      className="input-field pl-10"
                      aria-label="Auth header"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center justify-between p-3 bg-[#1b1b1c] border border-[#5c403c] cursor-pointer hover:border-orange-500 transition-colors">
                    <span className="label-caps text-[#e5e2e1]">Vulnerability Testing</span>
                    <input
                      type="checkbox"
                      checked={enableVuln}
                      onChange={(e) => setEnableVuln(e.target.checked)}
                      className="w-4 h-4 bg-neutral-900 border-[#5c403c] rounded focus:ring-0 accent-orange-500"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-[#1b1b1c] border border-[#5c403c] cursor-pointer hover:border-purple-500 transition-colors">
                    <span className="label-caps text-[#e5e2e1]">Bias Detection</span>
                    <input
                      type="checkbox"
                      checked={enableBias}
                      onChange={(e) => setEnableBias(e.target.checked)}
                      className="w-4 h-4 bg-neutral-900 border-[#5c403c] rounded focus:ring-0 accent-purple-500"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-red-400 text-sm font-mono" role="alert">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="w-full bg-red-600 hover:bg-red-500 active:scale-95 text-white font-semibold text-lg py-4 uppercase tracking-widest transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed glow-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Launching...
                </span>
              ) : (
                'LAUNCH AUDIT →'
              )}
            </button>
          </form>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-16">
        {features.map(({ icon, title, desc }) => (
          <div
            key={title}
            className="p-6 bg-[#111111] border border-[#5c403c] hover:border-red-600 transition-all group"
          >
            <div className="w-10 h-10 rounded-full border-2 border-red-600 flex items-center justify-center mb-4 group-hover:bg-red-600/10 transition-colors">
              <span className="material-symbols-outlined text-red-600 text-xl" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>
                {icon}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-sm text-neutral-500 leading-relaxed">{desc}</p>
          </div>
        ))}
      </section>

      {/* ── How It Works ── */}
      <section className="py-16">
        <h2 className="text-2xl font-semibold text-white mb-16 uppercase text-center tracking-tight">
          Operational Flow
        </h2>
        <div className="relative flex flex-col md:flex-row justify-between items-start gap-6">
          {/* dashed line */}
          <div className="hidden md:block absolute top-6 left-0 w-full h-[1px] border-t border-dashed border-red-600/50 z-0" />

          {steps.map(({ num, title, desc }) => (
            <div key={num} className="relative z-10 flex-1 text-center px-4">
              <div className="w-12 h-12 bg-neutral-950 border border-red-600 flex items-center justify-center mx-auto mb-4">
                <span className="font-mono text-sm text-red-600">{num}</span>
              </div>
              <h4
                className="text-white mb-1 uppercase"
                style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em' }}
              >
                {title}
              </h4>
              <p className="text-sm text-neutral-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
