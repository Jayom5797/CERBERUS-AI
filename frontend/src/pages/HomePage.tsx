import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Zap, Eye, Scale, ChevronRight, AlertTriangle } from 'lucide-react';
import { ScanForm } from '../components/ScanForm';

export function HomePage() {
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);

  const handleScanStarted = (scanId: string) => {
    setIsStarting(false);
    navigate(`/scan/${scanId}`);
  };

  const features = [
    {
      icon: Eye,
      title: 'Zero-Knowledge Testing',
      description: 'Works with only a URL. No source code, no documentation, no internal access required.',
      color: 'text-blue-400',
      bg: 'bg-blue-950',
    },
    {
      icon: Shield,
      title: 'Vulnerability Detection',
      description: 'Finds IDOR, auth bypass, input validation flaws, and business logic vulnerabilities.',
      color: 'text-red-400',
      bg: 'bg-red-950',
    },
    {
      icon: Scale,
      title: 'Bias Analysis',
      description: 'Detects discriminatory decision-making by testing identical profiles with different attributes.',
      color: 'text-purple-400',
      bg: 'bg-purple-950',
    },
    {
      icon: Zap,
      title: 'AI-Powered Reasoning',
      description: 'Google Gemini classifies endpoints, generates test cases, and explains findings.',
      color: 'text-yellow-400',
      bg: 'bg-yellow-950',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-red-950 border border-red-800 text-red-400 text-sm px-4 py-2 rounded-full mb-6">
          <AlertTriangle className="w-4 h-4" />
          Autonomous Black-Box AI Auditing
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 leading-tight">
          Test any AI app from
          <br />
          <span className="text-red-600">a single URL</span>
        </h1>

        <p className="text-xl text-[#8888aa] max-w-2xl mx-auto mb-10">
          CERBERUS-AI autonomously discovers hidden vulnerabilities, unsafe logic, and bias
          in AI-powered applications — before they cause real-world harm.
        </p>

        {/* Scan Form */}
        <div className="max-w-2xl mx-auto">
          <ScanForm onScanStarted={handleScanStarted} onLoading={setIsStarting} />
        </div>

        {/* Demo hint */}
        <p className="text-[#4a4a6a] text-sm mt-4">
          Try with any web application URL or API endpoint
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {features.map(({ icon: Icon, title, description, color, bg }) => (
          <div key={title} className="card p-6 hover:border-[#3a3a4a] transition-colors">
            <div className={`inline-flex p-3 rounded-lg ${bg} mb-4`}>
              <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <h3 className="font-semibold text-white mb-2">{title}</h3>
            <p className="text-[#8888aa] text-sm leading-relaxed">{description}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="card p-8">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { step: '01', title: 'Enter URL', desc: 'Provide any web app or API endpoint' },
            { step: '02', title: 'Crawl & Discover', desc: 'Playwright maps all API interactions' },
            { step: '03', title: 'AI Classification', desc: 'Gemini classifies and prioritizes endpoints' },
            { step: '04', title: 'Attack & Test', desc: 'IDOR, auth bypass, bias detection' },
            { step: '05', title: 'Report', desc: 'Proof, explanations, and fixes' },
          ].map(({ step, title, desc }, i) => (
            <div key={step} className="flex flex-col items-center text-center relative">
              <div className="w-12 h-12 rounded-full bg-red-950 border border-red-800 flex items-center justify-center text-red-400 font-mono font-bold text-sm mb-3">
                {step}
              </div>
              <h4 className="font-semibold text-white text-sm mb-1">{title}</h4>
              <p className="text-[#8888aa] text-xs">{desc}</p>
              {i < 4 && (
                <ChevronRight className="hidden lg:block absolute -right-2 top-3 w-4 h-4 text-[#3a3a4a]" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
