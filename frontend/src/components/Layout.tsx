import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, History, Home, Github, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'New Scan', icon: Home },
    { to: '/history', label: 'History', icon: History },
  ];

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen flex flex-col relative z-10">
      {/* Header */}
      <header className="bg-neutral-950/95 backdrop-blur-md border-b border-neutral-900 sticky top-0 z-50">
        <div className="flex justify-between items-center h-[79px] px-6 w-full max-w-screen-2xl mx-auto">

          {/* Logo + Desktop Nav */}
          <div className="flex items-center gap-8">
            <Link to="/" onClick={closeMenu} className="text-2xl font-black tracking-tighter text-white uppercase">
              CERBERUS-AI
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`font-sans uppercase tracking-widest font-bold text-sm transition-all duration-300 ${
                    location.pathname === to ? 'text-red-500' : 'text-neutral-400 hover:text-red-500'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right side — desktop */}
          <div className="hidden md:flex items-center gap-3">
            <Shield className="w-5 h-5 text-neutral-400" />

            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-1.5 font-sans uppercase tracking-widest font-bold text-sm transition-all duration-300 px-4 py-2 border ${
                    location.pathname === '/dashboard'
                      ? 'border-red-600 text-red-500'
                      : 'border-[#5c403c] text-neutral-400 hover:border-red-600 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] border border-[#5c403c] hover:border-red-600 transition-all"
                >
                  <div className="w-7 h-7 bg-red-950 border border-red-800 flex items-center justify-center text-red-400 font-bold text-xs font-mono">
                    {user.avatar}
                  </div>
                  <span className="font-mono text-sm text-neutral-300">{user.name.split(' ')[0]}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 font-sans uppercase tracking-widest font-bold text-sm text-neutral-500 hover:text-red-400 transition-all duration-300"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`font-sans uppercase tracking-widest font-bold text-sm transition-all duration-300 px-4 py-2 border ${
                    location.pathname === '/login'
                      ? 'border-red-600 text-red-500'
                      : 'border-[#5c403c] text-neutral-400 hover:border-red-600 hover:text-white'
                  }`}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className={`font-sans uppercase tracking-widest font-bold text-sm transition-all duration-300 px-4 py-2 ${
                    location.pathname === '/signup' ? 'bg-red-700 text-white' : 'bg-red-600 hover:bg-red-500 text-white glow-sm'
                  }`}
                >
                  Sign Up
                </Link>
              </>
            )}

            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans uppercase tracking-widest font-bold text-xs text-neutral-500 hover:text-white transition-all duration-300 flex items-center gap-1"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex items-center justify-center w-10 h-10 border border-[#5c403c] hover:border-red-600 text-neutral-400 hover:text-white transition-all"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden bg-neutral-950 border-t border-neutral-900">

            {/* ── The 4 core buttons always visible ── */}
            <div className="flex flex-col border-b border-[#5c403c]/30">
              <Link
                to="/"
                onClick={closeMenu}
                className={`flex items-center gap-3 px-6 py-4 font-sans uppercase tracking-widest font-bold text-sm transition-all border-l-4 ${
                  location.pathname === '/' ? 'border-red-600 text-red-500 bg-red-950/20' : 'border-transparent text-neutral-400 hover:bg-[#1a1a1a] hover:text-white hover:border-red-600'
                }`}
              >
                <Home className="w-4 h-4" />
                New Scan
              </Link>
              <Link
                to="/history"
                onClick={closeMenu}
                className={`flex items-center gap-3 px-6 py-4 font-sans uppercase tracking-widest font-bold text-sm transition-all border-l-4 ${
                  location.pathname === '/history' ? 'border-red-600 text-red-500 bg-red-950/20' : 'border-transparent text-neutral-400 hover:bg-[#1a1a1a] hover:text-white hover:border-red-600'
                }`}
              >
                <History className="w-4 h-4" />
                History
              </Link>
              <Link
                to="/login"
                onClick={closeMenu}
                className={`flex items-center gap-3 px-6 py-4 font-sans uppercase tracking-widest font-bold text-sm transition-all border-l-4 ${
                  location.pathname === '/login' ? 'border-red-600 text-red-500 bg-red-950/20' : 'border-transparent text-neutral-400 hover:bg-[#1a1a1a] hover:text-white hover:border-red-600'
                }`}
              >
                Login
              </Link>
              <Link
                to="/signup"
                onClick={closeMenu}
                className="flex items-center gap-3 px-6 py-4 bg-red-600 hover:bg-red-500 text-white font-sans uppercase tracking-widest font-bold text-sm transition-all border-l-4 border-red-800"
              >
                Sign Up
              </Link>
            </div>

            {/* ── Auth-aware extras ── */}
            <div className="px-4 py-3 space-y-1">
              {user ? (
                <>
                  {/* Avatar row */}
                  <div className="flex items-center gap-3 px-3 py-3 bg-[#1a1a1a] border border-[#5c403c]/30 mb-2">
                    <div className="w-8 h-8 bg-red-950 border border-red-800 flex items-center justify-center text-red-400 font-bold text-xs font-mono flex-shrink-0">
                      {user.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white font-semibold truncate">{user.name}</p>
                      <p className="font-mono text-[10px] text-neutral-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <Link
                    to="/dashboard"
                    onClick={closeMenu}
                    className={`flex items-center gap-3 px-3 py-3 font-sans uppercase tracking-widest font-bold text-sm transition-all border-l-2 ${
                      location.pathname === '/dashboard'
                        ? 'border-red-600 text-red-500 bg-red-950/20'
                        : 'border-transparent text-neutral-400 hover:border-red-600 hover:text-white hover:bg-[#1a1a1a]'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-3 font-sans uppercase tracking-widest font-bold text-sm text-neutral-400 hover:text-red-400 hover:bg-[#1a1a1a] border-l-2 border-transparent hover:border-red-600 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                <p className="font-mono text-[10px] text-neutral-600 uppercase tracking-widest text-center py-2">
                  Sign in to access your dashboard
                </p>
              )}

              {/* GitHub */}
              <div className="border-t border-[#5c403c]/20 pt-2 mt-1">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeMenu}
                  className="flex items-center gap-3 px-3 py-2 font-sans uppercase tracking-widest font-bold text-sm text-neutral-600 hover:text-white hover:bg-[#1a1a1a] transition-all"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 relative z-10">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-neutral-950 border-t border-neutral-900 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center py-8 px-6 w-full max-w-screen-2xl mx-auto gap-4">
          <span className="text-sm font-bold text-neutral-100">CERBERUS-AI</span>
          <div className="flex items-center gap-6">
            <a href="#" className="font-mono text-[10px] tracking-tight text-neutral-500 hover:text-white transition-colors">Documentation</a>
            <a href="#" className="font-mono text-[10px] tracking-tight text-neutral-500 hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="font-mono text-[10px] tracking-tight text-neutral-500 hover:text-white transition-colors">Terms of Service</a>
          </div>
          <span className="font-mono text-[10px] tracking-tight text-red-600">
            CERBERUS-AI — Autonomous Security Intelligence
          </span>
        </div>
      </footer>
    </div>
  );
}
