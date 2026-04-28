import { DiscoveredEndpoint } from '@cerberus/shared';

interface EndpointCardProps {
  endpoint: DiscoveredEndpoint;
  compact?: boolean;
}

const methodColors: Record<string, string> = {
  GET: 'text-blue-400 bg-blue-950',
  POST: 'text-green-400 bg-green-950',
  PUT: 'text-yellow-400 bg-yellow-950',
  PATCH: 'text-orange-400 bg-orange-950',
  DELETE: 'text-red-400 bg-red-950',
};

export function EndpointCard({ endpoint, compact = false }: EndpointCardProps) {
  const methodStyle = methodColors[endpoint.method] ?? 'text-gray-400 bg-gray-900';

  let path = endpoint.url;
  try {
    path = new URL(endpoint.url).pathname;
  } catch {
    // Keep full URL if parsing fails
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 bg-[#0a0a0f] rounded-lg text-xs">
        <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-xs ${methodStyle}`}>
          {endpoint.method}
        </span>
        <span className="text-[#8888aa] font-mono truncate flex-1" title={endpoint.url}>
          {path}
        </span>
        {endpoint.statusCode && (
          <span className={`font-mono text-xs ${endpoint.statusCode < 300 ? 'text-green-400' : endpoint.statusCode < 400 ? 'text-yellow-400' : 'text-red-400'}`}>
            {endpoint.statusCode}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="card p-4">
      <div className="flex items-center gap-3 mb-2">
        <span className={`font-mono font-bold px-2 py-1 rounded text-xs ${methodStyle}`}>
          {endpoint.method}
        </span>
        <span className="text-white font-mono text-sm truncate">{path}</span>
        {endpoint.category && (
          <span className="ml-auto text-xs text-[#4a4a6a] bg-[#1a1a24] px-2 py-0.5 rounded">
            {endpoint.category}
          </span>
        )}
      </div>
      {endpoint.riskScore !== undefined && (
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-[#8888aa]">Risk</span>
          <div className="flex-1 h-1.5 bg-[#2a2a3a] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${endpoint.riskScore >= 70 ? 'bg-red-600' : endpoint.riskScore >= 40 ? 'bg-yellow-600' : 'bg-green-600'}`}
              style={{ width: `${endpoint.riskScore}%` }}
            />
          </div>
          <span className="text-xs font-mono text-[#8888aa]">{endpoint.riskScore}</span>
        </div>
      )}
    </div>
  );
}
