import { Outlet, Link, useLocation } from 'react-router-dom';
import { Shield, History, Home, Github } from 'lucide-react';

export function Layout() {
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'New Scan', icon: Home },
    { to: '/history', label: 'History', icon: History },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[#2a2a3a] bg-[#0d0d14] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <Shield className="w-8 h-8 text-red-600 group-hover:text-red-500 transition-colors" />
                <div className="absolute inset-0 bg-red-600 opacity-20 blur-md rounded-full group-hover:opacity-30 transition-opacity" />
              </div>
              <div>
                <span className="text-xl font-bold text-white tracking-tight">CERBERUS</span>
                <span className="text-xl font-bold text-red-600 tracking-tight">-AI</span>
              </div>
            </Link>

            {/* Nav */}
            <nav className="flex items-center gap-1">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === to
                      ? 'bg-red-950 text-red-400'
                      : 'text-[#8888aa] hover:text-[#e8e8f0] hover:bg-[#1a1a24]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#8888aa] hover:text-[#e8e8f0] hover:bg-[#1a1a24] transition-colors ml-2"
              >
                <Github className="w-4 h-4" />
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2a2a3a] py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-[#4a4a6a] text-sm">
            CERBERUS-AI — Autonomous Black-Box AI System Auditor &nbsp;·&nbsp; Built for AI Integrity
          </p>
        </div>
      </footer>
    </div>
  );
}
