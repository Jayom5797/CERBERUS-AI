import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Shield, Bug, Scale, Globe } from 'lucide-react';
import { ScanJob, ScanEvent, DiscoveredEndpoint, VulnerabilityFinding, BiasFinding } from '@cerberus/shared';
import { apiClient } from '../services/apiClient';
import { useScanEvents } from '../hooks/useScanEvents';
import { SeverityBadge } from '../components/SeverityBadge';
import { EndpointCard } from '../components/EndpointCard';

export function ScanPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [scan, setScan] = useState<ScanJob | null>(null);
  const [endpoints, setEndpoints] = useState<DiscoveredEndpoint[]>([]);
  const [vulns, setVulns] = useState<VulnerabilityFinding[]>([]);
  const [biasFindings, setBiasFindings] = useState<BiasFinding[]>([]);
  const [error, setError] = useState('');

  // Load initial scan state
  useEffect(() => {
    if (!id) return;
    apiClient.getScan(id).then(setScan).catch(() => setError('Scan not found'));
  }, [id]);

  // Subscribe to SSE events
  useScanEvents(id!, (event: ScanEvent) => {
    switch (event.type) {
      case 'scan:status_change':
      case 'scan:progress': {
        const data = event.data as Partial<ScanJob>;
        setScan((prev) => prev ? { ...prev, ...data } : prev);
        break;
      }
      case 'crawler:endpoint_found': {
        const ep = event.data as DiscoveredEndpoint;
        setEndpoints((prev) => [...prev, ep]);
        break;
      }
      case 'scan:started': {
        const data = event.data as { endpoints?: DiscoveredEndpoint[] };
        if (data.endpoints) setEndpoints(data.endpoints);
        break;
      }
      case 'vuln:found': {
        setVulns((prev) => [...prev, event.data as VulnerabilityFinding]);
        break;
      }
      case 'bias:found': {
        setBiasFindings((prev) => [...prev, event.data as BiasFinding]);
        break;
      }
      case 'scan:completed': {
        const data = event.data as { report?: { endpoints?: DiscoveredEndpoint[]; vulnerabilities?: VulnerabilityFinding[]; biasFindings?: BiasFinding[] } };
        if (data.report) {
          if (data.report.endpoints) setEndpoints(data.report.endpoints);
          if (data.report.vulnerabilities) setVulns(data.report.vulnerabilities);
          if (data.report.biasFindings) setBiasFindings(data.report.biasFindings);
        }
        setScan((prev) => prev ? { ...prev, status: 'completed', progress: 100 } : prev);
        break;
      }
      case 'scan:failed': {
        const data = event.data as { error?: string };
        setScan((prev) => prev ? { ...prev, status: 'failed' } : prev);
        setError(data.error || 'Scan failed');
        break;
      }
    }
  });

  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    queued: { label: 'Queued', color: 'text-gray-400', icon: <Loader2 className="w-5 h-5 animate-spin" /> },
    crawling: { label: 'Crawling Application', color: 'text-blue-400', icon: <Globe className="w-5 h-5 animate-pulse" /> },
    analyzing: { label: 'AI Classification', color: 'text-purple-400', icon: <Loader2 className="w-5 h-5 animate-spin" /> },
    testing: { label: 'Vulnerability Testing', color: 'text-orange-400', icon: <Bug className="w-5 h-5 animate-pulse" /> },
    bias_check: { label: 'Bias Detection', color: 'text-yellow-400', icon: <Scale className="w-5 h-5 animate-pulse" /> },
    reporting: { label: 'Generating Report', color: 'text-green-400', icon: <Loader2 className="w-5 h-5 animate-spin" /> },
    completed: { label: 'Audit Complete', color: 'text-green-400', icon: <CheckCircle className="w-5 h-5" /> },
    failed: { label: 'Scan Failed', color: 'text-red-400', icon: <XCircle className="w-5 h-5" /> },
  };

  const phases = [
    { key: 'crawling', label: 'Crawl' },
    { key: 'analyzing', label: 'Classify' },
    { key: 'testing', label: 'Test' },
    { key: 'bias_check', label: 'Bias' },
    { key: 'reporting', label: 'Report' },
    { key: 'completed', label: 'Done' },
  ];

  const phaseOrder = phases.map((p) => p.key);
  const currentPhaseIdx = scan ? phaseOrder.indexOf(scan.status) : -1;

  if (error && !scan) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Scan Not Found</h2>
        <p className="text-[#8888aa] mb-6">{error}</p>
        <button onClick={() => navigate('/')} className="btn-primary">Start New Scan</button>
      </div>
    );
  }

  const status = scan?.status ?? 'queued';
  const statusInfo = statusConfig[status] ?? statusConfig.queued;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={statusInfo.color}>{statusInfo.icon}</span>
              <span className={`font-semibold text-lg ${statusInfo.color}`}>{statusInfo.label}</span>
            </div>
            <p className="text-[#8888aa] text-sm font-mono break-all">{scan?.targetUrl}</p>
            <p className="text-[#4a4a6a] text-xs mt-1">Scan ID: {id}</p>
          </div>

          {scan?.status === 'completed' && (
            <button
              onClick={() => navigate(`/report/${id}`)}
              className="btn-primary"
            >
              View Full Report →
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex justify-between text-xs text-[#8888aa] mb-2">
            <span>Progress</span>
            <span>{scan?.progress ?? 0}%</span>
          </div>
          <div className="h-2 bg-[#0a0a0f] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-700 to-red-500 rounded-full transition-all duration-500"
              style={{ width: `${scan?.progress ?? 0}%` }}
            />
          </div>
        </div>

        {/* Phase indicators */}
        <div className="flex items-center gap-2 mt-5 overflow-x-auto pb-1">
          {phases.map(({ key, label }, i) => {
            const isDone = currentPhaseIdx > i || status === 'completed';
            const isActive = currentPhaseIdx === i;
            return (
              <div key={key} className="flex items-center gap-2 flex-shrink-0">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  isDone ? 'bg-green-950 border-green-800 text-green-400'
                  : isActive ? 'bg-red-950 border-red-800 text-red-400 scan-pulse'
                  : 'bg-[#0a0a0f] border-[#2a2a3a] text-[#4a4a6a]'
                }`}>
                  {isDone && <CheckCircle className="w-3 h-3" />}
                  {isActive && <Loader2 className="w-3 h-3 animate-spin" />}
                  {label}
                </div>
                {i < phases.length - 1 && <div className="w-4 h-px bg-[#2a2a3a]" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Endpoints */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-white">Discovered Endpoints</h3>
            <span className="ml-auto bg-blue-950 text-blue-400 text-xs px-2 py-0.5 rounded-full border border-blue-800">
              {endpoints.length}
            </span>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {endpoints.length === 0 ? (
              <p className="text-[#4a4a6a] text-sm text-center py-8">
                {status === 'crawling' ? 'Crawling...' : 'No endpoints yet'}
              </p>
            ) : (
              endpoints.map((ep, i) => <EndpointCard key={i} endpoint={ep} compact />)
            )}
          </div>
        </div>

        {/* Vulnerabilities */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bug className="w-5 h-5 text-red-400" />
            <h3 className="font-semibold text-white">Vulnerabilities</h3>
            <span className="ml-auto bg-red-950 text-red-400 text-xs px-2 py-0.5 rounded-full border border-red-800">
              {vulns.length}
            </span>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {vulns.length === 0 ? (
              <p className="text-[#4a4a6a] text-sm text-center py-8">
                {['testing', 'bias_check', 'reporting', 'completed'].includes(status) ? 'None found' : 'Testing...'}
              </p>
            ) : (
              vulns.map((v) => (
                <div key={v.id} className="p-3 bg-[#0a0a0f] rounded-lg border border-[#2a2a3a]">
                  <div className="flex items-start gap-2 mb-1">
                    <SeverityBadge severity={v.severity} />
                    <span className="text-xs font-mono text-[#8888aa]">{v.type}</span>
                  </div>
                  <p className="text-sm text-white leading-snug">{v.title}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bias */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-white">Bias Findings</h3>
            <span className="ml-auto bg-purple-950 text-purple-400 text-xs px-2 py-0.5 rounded-full border border-purple-800">
              {biasFindings.length}
            </span>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {biasFindings.length === 0 ? (
              <p className="text-[#4a4a6a] text-sm text-center py-8">
                {['bias_check', 'reporting', 'completed'].includes(status) ? 'None found' : 'Pending...'}
              </p>
            ) : (
              biasFindings.map((b) => (
                <div key={b.id} className="p-3 bg-[#0a0a0f] rounded-lg border border-[#2a2a3a]">
                  <div className="flex items-center gap-2 mb-1">
                    <SeverityBadge severity={b.severity} />
                    <span className="text-xs font-mono text-purple-400">{b.attribute}</span>
                  </div>
                  <p className="text-sm text-white leading-snug">{b.title}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[#2a2a3a] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-600 rounded-full"
                        style={{ width: `${b.disparityScore * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-[#8888aa]">{Math.round(b.disparityScore * 100)}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-6 card p-4 border-red-800 bg-red-950">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
