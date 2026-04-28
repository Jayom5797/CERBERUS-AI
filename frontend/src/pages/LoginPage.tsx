import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Terminal, Mail, Lock, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEMO = { email: 'admin@cerberus.io', password: 'cerberus123' };

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const fillDemo = () => {
    setEmail(DEMO.email);
    setPassword(DEMO.password);
    setError('');
  };

  const copyField = async (val: string, key: string) => {
    await navigator.clipboard.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-[440px]">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white uppercase tracking-tighter mb-2">
            Access Terminal
          </h1>
          <p className="text-sm text-neutral-500">
            Sign in to your CERBERUS-AI account
          </p>
        </div>

        {/* Demo credentials banner */}
        <div className="bg-[#0d0d0d] border border-[#5c403c]/50 border-l-2 border-l-red-600 p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="label-caps text-red-500">Demo Credentials</span>
            <button
              type="button"
              onClick={fillDemo}
              className="font-mono text-[10px] text-red-600 hover:text-red-400 uppercase tracking-widest transition-colors"
            >
              Auto-fill →
            </button>
          </div>
          <div className="space-y-1.5">
            {[
              { label: 'Email', val: DEMO.email, key: 'email' },
              { label: 'Password', val: DEMO.password, key: 'pass' },
            ].map(({ label, val, key }) => (
              <div key={key} className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] text-neutral-600 w-16">{label}</span>
                <span className="font-mono text-xs text-neutral-300 flex-1">{val}</span>
                <button
                  type="button"
                  onClick={() => copyField(val, key)}
                  className="text-neutral-600 hover:text-neutral-300 transition-colors"
                  aria-label={`Copy ${label}`}
                >
                  {copied === key
                    ? <Check className="w-3.5 h-3.5 text-green-400" />
                    : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#111111] border-t-2 border-red-600 border-x border-b border-[#5c403c]/30 p-8 relative overflow-hidden">
          <div className="scanline absolute inset-0 pointer-events-none opacity-20" />

          <h2 className="text-xl font-semibold text-white mb-6 uppercase flex items-center gap-2 tracking-tight">
            <Terminal className="w-5 h-5 text-red-600" />
            Login
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {/* Email */}
            <div className="space-y-1">
              <label className="label-caps">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-neutral-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@cerberus.io"
                  className="input-field pl-10"
                  required
                  disabled={loading}
                  aria-label="Email address"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="label-caps">Password</label>
                <a href="#" className="font-mono text-[10px] text-red-600 hover:text-red-400 transition-colors">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-neutral-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="input-field pl-10 pr-10"
                  required
                  disabled={loading}
                  aria-label="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-neutral-500 hover:text-neutral-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-red-400 text-xs font-mono bg-red-950/40 border border-red-800/50 px-3 py-2" role="alert">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email.trim() || !password.trim()}
              className="w-full bg-red-600 hover:bg-red-500 active:scale-95 text-white font-semibold text-base py-4 uppercase tracking-widest transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed glow-sm mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                'AUTHENTICATE →'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 z-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#5c403c]/40" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#111111] px-3 font-mono text-[10px] text-neutral-600 uppercase tracking-widest">
                No account?
              </span>
            </div>
          </div>

          <div className="relative z-10">
            <Link
              to="/signup"
              className="block w-full text-center border border-[#5c403c] hover:border-red-600 text-neutral-400 hover:text-white font-semibold text-sm py-3 uppercase tracking-widest transition-all duration-200"
            >
              Create Account
            </Link>
          </div>
        </div>

        <p className="text-center font-mono text-[10px] text-neutral-600 mt-6 uppercase tracking-widest">
          Protected by CERBERUS-AI Security
        </p>
      </div>
    </div>
  );
}
