import { useState } from 'react';
import { Search, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { apiClient } from '../services/apiClient';

interface ScanFormProps {
  onScanStarted: (scanId: string) => void;
  onLoading: (loading: boolean) => void;
}

export function ScanForm({ onScanStarted, onLoading }: ScanFormProps) {
  const [url, setUrl] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Options
  const [enableBias, setEnableBias] = useState(true);
  const [enableVuln, setEnableVuln] = useState(true);
  const [maxDepth, setMaxDepth] = useState(3);
  const [authHeader, setAuthHeader] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setError('');
    setLoading(true);
    onLoading(true);

    try {
      const authHeaders: Record<string, string> = {};
      if (authHeader.trim()) {
        // Parse "Key: Value" format
        const [key, ...rest] = authHeader.split(':');
        if (key && rest.length > 0) {
          authHeaders[key.trim()] = rest.join(':').trim();
        }
      }

      const response = await apiClient.startScan({
        targetUrl: url.trim(),
        options: {
          enableBiasDetection: enableBias,
          enableVulnTesting: enableVuln,
          maxDepth,
          ...(Object.keys(authHeaders).length > 0 ? { authHeaders } : {}),
        },
      });

      onScanStarted(response.scanId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start scan';
      setError(message);
      onLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* URL Input */}
      <div className="flex gap-3 mb-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4a4a6a]" />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://target-application.com"
            className="input-field pl-12 text-lg h-14"
            required
            disabled={loading}
            aria-label="Target URL to audit"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="btn-primary h-14 px-8 text-base whitespace-nowrap"
          aria-label="Start security audit"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Starting...
            </span>
          ) : (
            'Audit Now'
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-400 text-sm mb-3 text-left" role="alert">
          {error}
        </p>
      )}

      {/* Advanced Options Toggle */}
      <button
        type="button"
        onClick={() => setShowOptions(!showOptions)}
        className="flex items-center gap-2 text-[#8888aa] hover:text-[#e8e8f0] text-sm transition-colors"
      >
        <Settings className="w-4 h-4" />
        Advanced Options
        {showOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {showOptions && (
        <div className="mt-4 card p-5 text-left space-y-4">
          {/* Toggles */}
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={enableVuln}
                onChange={(e) => setEnableVuln(e.target.checked)}
                className="w-4 h-4 accent-red-600"
              />
              <span className="text-sm text-[#e8e8f0]">Vulnerability Testing</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={enableBias}
                onChange={(e) => setEnableBias(e.target.checked)}
                className="w-4 h-4 accent-red-600"
              />
              <span className="text-sm text-[#e8e8f0]">Bias Detection</span>
            </label>
          </div>

          {/* Crawl Depth */}
          <div>
            <label className="block text-sm text-[#8888aa] mb-2">
              Crawl Depth: <span className="text-white">{maxDepth}</span>
            </label>
            <input
              type="range"
              min={1}
              max={5}
              value={maxDepth}
              onChange={(e) => setMaxDepth(Number(e.target.value))}
              className="w-full accent-red-600"
            />
            <div className="flex justify-between text-xs text-[#4a4a6a] mt-1">
              <span>Shallow (1)</span>
              <span>Deep (5)</span>
            </div>
          </div>

          {/* Auth Header */}
          <div>
            <label className="block text-sm text-[#8888aa] mb-2">
              Auth Header (optional)
            </label>
            <input
              type="text"
              value={authHeader}
              onChange={(e) => setAuthHeader(e.target.value)}
              placeholder="Authorization: Bearer your-token-here"
              className="input-field text-sm font-mono"
            />
          </div>
        </div>
      )}
    </form>
  );
}
