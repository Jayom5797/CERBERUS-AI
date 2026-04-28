import { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';
import { VulnProof } from '@cerberus/shared';

interface ProofViewerProps {
  proof: VulnProof;
}

export function ProofViewer({ proof }: ProofViewerProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'original' | 'malicious' | 'diff'>('malicious');

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const tabs = [
    { key: 'original' as const, label: 'Original Request' },
    { key: 'malicious' as const, label: 'Attack Request' },
    { key: 'diff' as const, label: 'Difference' },
  ];

  const activeRequest = activeTab === 'original' ? proof.originalRequest : proof.maliciousRequest;
  const activeResponse = activeTab === 'original' ? proof.originalResponse : proof.maliciousResponse;

  return (
    <div>
      <h5 className="text-xs font-semibold text-[#8888aa] uppercase tracking-wider mb-3 flex items-center gap-2">
        <Terminal className="w-4 h-4" />
        Proof of Concept
      </h5>

      {/* Tabs */}
      <div className="flex gap-1 mb-3">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              activeTab === key
                ? 'bg-red-950 text-red-400 border border-red-800'
                : 'text-[#8888aa] hover:text-white hover:bg-[#1a1a24]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'diff' ? (
        <div className="bg-[#0a0a0f] rounded-lg p-4 border border-[#2a2a3a]">
          <p className="text-yellow-400 text-sm">{proof.difference}</p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[#8888aa] mb-1">Original Response</p>
              <span className={`font-mono ${proof.originalResponse.statusCode < 300 ? 'text-green-400' : 'text-red-400'}`}>
                HTTP {proof.originalResponse.statusCode}
              </span>
            </div>
            <div>
              <p className="text-[#8888aa] mb-1">Attack Response</p>
              <span className={`font-mono ${proof.maliciousResponse.statusCode < 300 ? 'text-green-400' : 'text-red-400'}`}>
                HTTP {proof.maliciousResponse.statusCode}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* cURL command */}
          <div className="bg-[#0a0a0f] rounded-lg border border-[#2a2a3a] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#2a2a3a]">
              <span className="text-xs text-[#8888aa]">cURL</span>
              <button
                onClick={() => copyToClipboard(activeRequest.curlCommand, 'curl')}
                className="flex items-center gap-1 text-xs text-[#8888aa] hover:text-white transition-colors"
                aria-label="Copy cURL command"
              >
                {copied === 'curl' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                {copied === 'curl' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="p-4 text-xs text-green-400 font-mono overflow-x-auto whitespace-pre-wrap break-all">
              {activeRequest.curlCommand}
            </pre>
          </div>

          {/* Response */}
          <div className="bg-[#0a0a0f] rounded-lg border border-[#2a2a3a] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#2a2a3a]">
              <span className="text-xs text-[#8888aa]">
                Response
                <span className={`ml-2 font-mono ${activeResponse.statusCode < 300 ? 'text-green-400' : activeResponse.statusCode < 400 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {activeResponse.statusCode}
                </span>
                <span className="text-[#4a4a6a] ml-2">{activeResponse.duration}ms</span>
              </span>
              <button
                onClick={() => copyToClipboard(JSON.stringify(activeResponse.body, null, 2), 'response')}
                className="flex items-center gap-1 text-xs text-[#8888aa] hover:text-white transition-colors"
                aria-label="Copy response"
              >
                {copied === 'response' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                {copied === 'response' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="p-4 text-xs text-[#8888aa] font-mono overflow-x-auto max-h-48 whitespace-pre-wrap">
              {JSON.stringify(activeResponse.body, null, 2).slice(0, 1000)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
