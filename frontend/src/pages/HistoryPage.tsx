import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Shield, ChevronRight, RefreshCw } from 'lucide-react';
import { ScanJob } from '@cerberus/shared';
import { apiClient } from '../services/apiClient';

export function HistoryPage() {
  const navigate = useNavigate();
  const [scans, setScans] = useState<ScanJob[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    apiClient.listScans()
      .then(setScans)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const statusColors: Record<string, string> = {
    completed: 'text-green-400 bg-green-950 border-green-800',
    failed: 'text-red-400 bg-red-950 border-red-800',
    queued: 'text-gray-400 bg-gray-900 border-gray-700',
    crawling: 'text-blue-400 bg-blue-950 border-blue-800',
    analyzing: 'text-purple-400 bg-purple-950 border-purple-800',
    testing: 'text-orange-400 bg-orange-950 border-orange-800',
    bias_check: 'text-yellow-400 bg-yellow-950 border-yellow-800',
    reporting: 'text-green-400 bg-green-950 border-green-800',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Clock className="w-6 h-6 text-[#8888aa]" />
          Scan History
        </h1>
        <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[#8888aa]">Loading scans...</p>
        </div>
      ) : scans.length === 0 ? (
        <div className="card p-16 text-center">
          <Shield className="w-12 h-12 text-[#3a3a4a] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No scans yet</h3>
          <p className="text-[#8888aa] mb-6">Start your first audit to see results here.</p>
          <button onClick={() => navigate('/')} className="btn-primary">Start Audit</button>
        </div>
      ) : (
        <div className="space-y-3">
          {scans.map((scan) => (
            <button
              key={scan.id}
              onClick={() => navigate(scan.status === 'completed' ? `/report/${scan.id}` : `/scan/${scan.id}`)}
              className="w-full card p-5 text-left hover:border-[#3a3a4a] transition-colors flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded border font-medium ${statusColors[scan.status] ?? statusColors.queued}`}>
                    {scan.status}
                  </span>
                  {scan.status !== 'completed' && scan.status !== 'failed' && (
                    <div className="flex-1 max-w-24 h-1.5 bg-[#2a2a3a] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-600 rounded-full transition-all"
                        style={{ width: `${scan.progress}%` }}
                      />
                    </div>
                  )}
                </div>
                <p className="text-white font-medium text-sm truncate">{scan.targetUrl}</p>
                <p className="text-[#4a4a6a] text-xs mt-1">
                  {new Date(scan.createdAt).toLocaleString()} · ID: {scan.id.slice(0, 8)}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-[#4a4a6a] flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
