import { createContext, useContext, useState, ReactNode } from 'react';

export interface User {
  name: string;
  email: string;
  role: string;
  avatar: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// ── Demo credentials ──────────────────────────────────────────────────────────
const DEMO_USERS: Record<string, { password: string; user: User }> = {
  'admin@cerberus.io': {
    password: 'cerberus123',
    user: { name: 'Alex Operator', email: 'admin@cerberus.io', role: 'Admin', avatar: 'AO' },
  },
  'demo@cerberus.io': {
    password: 'demo1234',
    user: { name: 'Demo User', email: 'demo@cerberus.io', role: 'Analyst', avatar: 'DU' },
  },
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('cerberus_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email: string, password: string) => {
    await new Promise((r) => setTimeout(r, 700)); // simulate network
    const match = DEMO_USERS[email.toLowerCase()];
    if (!match || match.password !== password) {
      throw new Error('Invalid credentials. Try admin@cerberus.io / cerberus123');
    }
    setUser(match.user);
    localStorage.setItem('cerberus_user', JSON.stringify(match.user));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cerberus_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
