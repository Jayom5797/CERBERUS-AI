import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Terminal, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    // TODO: wire up real auth
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    navigate('/');
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
              <p className="text-red-400 text-xs font-mono" role="alert">{error}</p>
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

        {/* Bottom note */}
        <p className="text-center font-mono text-[10px] text-neutral-600 mt-6 uppercase tracking-widest">
          Protected by CERBERUS-AI Security
        </p>
      </div>
    </div>
  );
}
