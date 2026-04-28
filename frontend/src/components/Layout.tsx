import { Outlet, Link, useLocation } from 'react-router-dom';
import { Shield, History, Home, Github } from 'lucide-react';

export function Layout() {
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'New Scan', icon: Home },
    { to: '/history', label: 'History', icon: History },
  ];

  return (
    <div className="min-h-screen flex flex-col relative z-10">
      {/* Header */}
      <header className="bg-neutral-950/95 backdrop-blur-md border-b border-neutral-900 sticky top-0 z-50">
        <div className="flex justify-between items-center h-16 px-6 w-full max-w-screen-2xl mx-auto">
          {/* Logo + Nav */}
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-black tracking-tighter text-white uppercase">
              CERBERUS-AI
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`font-sans uppercase tracking-widest font-bold text-xs transition-all duration-300 ${
                    location.pathname === to
                      ? 'text-red-500'
                      : 'text-neutral-400 hover:text-red-500'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-neutral-400 hidden sm:block" />
            <Link
              to="/login"
              className={`font-sans uppercase tracking-widest font-bold text-xs transition-all duration-300 px-3 py-1.5 border ${
                location.pathname === '/login'
                  ? 'border-red-600 text-red-500'
                  : 'border-[#5c403c] text-neutral-400 hover:border-red-600 hover:text-white'
              }`}
            >
              Login
            </Link>
            <Link
              to="/signup"
              className={`font-sans uppercase tracking-widest font-bold text-xs transition-all duration-300 px-3 py-1.5 ${
                location.pathname === '/signup'
                  ? 'bg-red-700 text-white'
                  : 'bg-red-600 hover:bg-red-500 text-white glow-sm'
              }`}
            >
              Sign Up
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans uppercase tracking-widest font-bold text-xs text-neutral-500 hover:text-white transition-all duration-300 hidden md:flex items-center gap-1"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
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
