import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Terminal, Mail, Lock, User, Eye, EyeOff, Shield } from 'lucide-react';

export function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordStrength = (p: string) => {
    if (p.length === 0) return null;
    if (p.length < 6) return { label: 'Weak', color: 'bg-red-600', width: 'w-1/4' };
    if (p.length < 10) return { label: 'Fair', color: 'bg-orange-500', width: 'w-2/4' };
    if (!/[^a-zA-Z0-9]/.test(p)) return { label: 'Good', color: 'bg-yellow-500', width: 'w-3/4' };
    return { label: 'Strong', color: 'bg-green-500', width: 'w-full' };
  };

  const strength = passwordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
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
            Enlist Now
          </h1>
          <p className="text-sm text-neutral-500">
            Create your CERBERUS-AI operator account
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#111111] border-t-2 border-red-600 border-x border-b border-[#5c403c]/30 p-8 relative overflow-hidden">
          <div className="scanline absolute inset-0 pointer-events-none opacity-20" />

          <h2 className="text-xl font-semibold text-white mb-6 uppercase flex items-center gap-2 tracking-tight">
            <Terminal className="w-5 h-5 text-red-600" />
            Register
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="label-caps">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Operator"
                  className="input-field pl-10"
                  required
                  disabled={loading}
                  aria-label="Full name"
                />
              </div>
            </div>

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
              <label className="label-caps">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-neutral-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
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
              {/* Strength bar */}
              {strength && (
                <div className="mt-2 space-y-1">
                  <div className="h-1 w-full bg-neutral-800 rounded-none overflow-hidden">
                    <div className={`h-full ${strength.color} ${strength.width} transition-all duration-300`} />
                  </div>
                  <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
                    Strength: <span className="text-neutral-300">{strength.label}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="label-caps">Confirm Password</label>
              <div className="relative">
                <Shield className="absolute left-3 top-3.5 w-4 h-4 text-neutral-500" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  className={`input-field pl-10 pr-10 ${
                    confirm && confirm !== password ? 'border-red-600' : ''
                  }`}
                  required
                  disabled={loading}
                  aria-label="Confirm password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-3.5 text-neutral-500 hover:text-neutral-300 transition-colors"
                  aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirm && confirm !== password && (
                <p className="font-mono text-[10px] text-red-500 uppercase tracking-widest">
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <p className="text-red-400 text-xs font-mono" role="alert">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !name.trim() || !email.trim() || !password || !confirm}
              className="w-full bg-red-600 hover:bg-red-500 active:scale-95 text-white font-semibold text-base py-4 uppercase tracking-widest transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed glow-sm mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating Account...
                </span>
              ) : (
                'CREATE ACCOUNT →'
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
                Have an account?
              </span>
            </div>
          </div>

          <div className="relative z-10">
            <Link
              to="/login"
              className="block w-full text-center border border-[#5c403c] hover:border-red-600 text-neutral-400 hover:text-white font-semibold text-sm py-3 uppercase tracking-widest transition-all duration-200"
            >
              Sign In
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
