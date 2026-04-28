import { useNavigate, Link } from 'react-router-dom';
import {
  Shield, Bug, Scale, Globe, Clock, ChevronRight,
  LogOut, User, Zap, TrendingUp, AlertTriangle, CheckCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ── Static demo data ──────────────────────────────────────────────────────────
const STATS = [
  { label: 'Total Scans', value: '24', icon: Globe, color: 'text-blue-400', bg: 'bg-blue-950', border: 'border-blue-800' },
  { label: 'Vulnerabilities', value: '138', icon: Bug, color: 'text-red-400', bg: 'bg-red-950', border: 'border-red-800' },
  { label: 'Bias Issues', value: '17', icon: Scale, color: 'text-purple-400', bg: 'bg-purple-950', border: 'border-purple-800' },
  { label: 'Avg Risk Score', value: '62', icon: TrendingUp, color: 'text-orange-400', bg: 'bg-orange-950', border: 'border-orange-800' },
];

const RECENT_SCANS = [
  { id: 'a1b2c3d4', url: 'https://api.fintech-demo.io', status: 'completed', risk: 'critical', vulns: 12, bias: 3, date: '2026-04-27' },
  { id: 'e5f6g7h8', url: 'https://shop.ecommerce-test.com', status: 'completed', risk: 'high', vulns: 7, bias: 1, date: '2026-04-26' },
  { id: 'i9j0k1l2', url: 'https://hr.internal-demo.net', status: 'completed', risk: 'medium', vulns: 4, bias: 5, date: '2026-04-25' },
  { id: 'm3n4o5p6', url: 'https://api.healthapp-demo.io', status: 'completed', risk: 'low', vulns: 1, bias: 0, date: '2026-04-24' },
  { id: 'q7r8s9t0', url: 'https://dashboard.saas-test.com', status: 'failed', risk: '—', vulns: 0, bias: 0, date: '2026-04-23' },
];

const ACTIVITY = [
  { icon: Bug, color: 'text-red-400', msg: 'Critical IDOR found on /api/users/:id', time: '2h ago' },
  { icon: Scale, color: 'text-purple-400', msg: 'Gender bias detected on /api/loan/apply', time: '5h ago' },
  { icon: AlertTriangle, color: 'text-orange-400', msg: 'Auth bypass on /admin/settings', time: '1d ago' },
  { icon: CheckCircle, color: 'text-green-400', msg: 'Scan completed — healthapp-demo.io', time: '2d ago' },
  { icon: Zap, color: 'text-yellow-400', msg: 'New scan started — saas-test.com', time: '3d ago' },
];

const riskColors: Record<string, string> = {
  critical: 'text-red-400 bg-red-950 border-red-800',
  high: 'text-orange-400 bg-orange-950 border-orange-800',
  medium: 'text-yellow-400 bg-yellow-950 border-yellow-800',
  low: 'text-green-400 bg-green-950 border-green-800',
  '—': 'text-neutral-500 bg-neutral-900 border-neutral-700',
};

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-[calc(100vh-64px)] px-6 py-8 max-w-screen-2xl mx-auto">

      {/* ── Top bar ── */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <p className="label-caps text-neutral-500 mb-1">Welcome back</p>
          <h1 className="text-3xl font-bold text-white uppercase tracking-tighter">
            {user?.name}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-[10px] text-neutral-500">{user?.email}</span>
            <span className="px-2 py-0.5 bg-red-950 border border-red-800 text-red-400 font-mono text-[10px] uppercase">
              {user?.role}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs uppercase tracking-widest transition-all glow-sm"
          >
            <Shield className="w-4 h-4" />
            New Audit
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 border border-[#5c403c] hover:border-red-600 text-neutral-400 hover:text-white font-semibold text-xs uppercase tracking-widest transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={`p-5 bg-[#111111] border ${border} relative overflow-hidden`}>
            <div className="scanline absolute inset-0 pointer-events-none opacity-10" />
            <div className={`inline-flex p-2 ${bg} border ${border} mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className={`text-4xl font-bold ${color} font-mono mb-1`}>{value}</div>
            <div className="label-caps text-neutral-500">{label}</div>
          </div>
        ))}
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent scans — takes 2 cols */}
        <div className="lg:col-span-2 bg-[#111111] border-t-2 border-red-600 border-x border-b border-[#5c403c]/30">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#5c403c]/30">
            <h2 className="text-sm font-semibold text-white uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-600" />
              Recent Scans
            </h2>
            <Link to="/history" className="font-mono text-[10px] text-red-600 hover:text-red-400 uppercase tracking-widest transition-colors">
              View All →
            </Link>
          </div>

          <div className="divide-y divide-[#5c403c]/20">
            {RECENT_SCANS.map((scan) => (
              <div
                key={scan.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-[#1a1a1a] transition-colors cursor-pointer group"
                onClick={() => navigate(scan.status === 'completed' ? `/report/${scan.id}` : `/scan/${scan.id}`)}
              >
                {/* Status dot */}
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${scan.status === 'completed' ? 'bg-green-500' : 'bg-red-500'}`} />

                {/* URL + meta */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-mono truncate">{scan.url}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="font-mono text-[10px] text-neutral-600">{scan.date}</span>
                    <span className="font-mono text-[10px] text-neutral-600">ID: {scan.id.slice(0, 8)}</span>
                  </div>
                </div>

                {/* Counts */}
                <div className="hidden sm:flex items-center gap-3 text-xs font-mono">
                  <span className="text-red-400">{scan.vulns} vulns</span>
                  <span className="text-purple-400">{scan.bias} bias</span>
                </div>

                {/* Risk badge */}
                <span className={`px-2 py-0.5 border text-[10px] font-bold uppercase font-mono flex-shrink-0 ${riskColors[scan.risk]}`}>
                  {scan.risk}
                </span>

                <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-300 transition-colors flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">

          {/* Profile card */}
          <div className="bg-[#111111] border border-[#5c403c]/30 p-5">
            <h2 className="label-caps text-neutral-500 mb-4">Operator Profile</h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-950 border border-red-800 flex items-center justify-center text-red-400 font-bold text-lg font-mono">
                {user?.avatar}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{user?.name}</p>
                <p className="font-mono text-[10px] text-neutral-500">{user?.email}</p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Role', value: user?.role ?? '—' },
                { label: 'Scans Run', value: '24' },
                { label: 'Issues Found', value: '155' },
                { label: 'Member Since', value: 'Apr 2026' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-1.5 border-b border-[#5c403c]/20">
                  <span className="label-caps text-neutral-600">{label}</span>
                  <span className="font-mono text-xs text-neutral-300">{value}</span>
                </div>
              ))}
            </div>
            <button
              onClick={handleLogout}
              className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 border border-[#5c403c] hover:border-red-600 text-neutral-400 hover:text-white text-xs uppercase tracking-widest font-semibold transition-all"
            >
              <User className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>

          {/* Activity feed */}
          <div className="bg-[#111111] border border-[#5c403c]/30 p-5 flex-1">
            <h2 className="label-caps text-neutral-500 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {ACTIVITY.map(({ icon: Icon, color, msg, time }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-[#1a1a1a] border border-[#5c403c]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-neutral-300 leading-snug">{msg}</p>
                    <p className="font-mono text-[10px] text-neutral-600 mt-0.5">{time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
