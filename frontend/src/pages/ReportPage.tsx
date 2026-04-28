import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Shield, Bug, Scale, Globe, Download, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle, Clock, ExternalLink
} from 'lucide-react';
import { AuditReport, VulnerabilityFinding, BiasFinding } from '@cerberus/shared';
import { apiClient } from '../services/apiClient';
import { SeverityBadge } from '../components/SeverityBadge';
import { RiskGauge } from '../components/RiskGauge';
import { ProofViewer } from '../components/ProofViewer';
import { BiasChart } from '../components/BiasChart';

export function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedVuln, setExpandedVuln] = useState<string | null>(null);
  const [expandedBias, setExpandedBias] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    apiClient.getReport(id)
      .then(setReport)
      .catch(() => setError('Report not found or scan still in progress.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = () => {
    if (!id) return;
    window.open(`/api/reports/${id}/download`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#8888aa]">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Report Unavailable</h2>
        <p className="text-[#8888aa] mb-6">{error}</p>
        <button onClick={() => navigate(`/scan/${id}`)} className="btn-secondary mr-3">
          View Scan Progress
        </button>
        <button onClick={() => navigate('/')} className="btn-primary">New Scan</button>
      </div>
    );
  }

  const { summary } = report;
  const riskColors: Record<string, string> = {
    critical: 'text-red-400',
    high: 'text-orange-400',
    medium: 'text-yellow-400',
    low: 'text-green-400',
    safe: 'text-emerald-400',
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Report Header */}
      <div className="card p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-6 h-6 text-red-500" />
              <h1 className="text-2xl font-bold text-white">Audit Report</h1>
              <span className={`text-sm font-semibold uppercase ${riskColors[summary.riskLevel]}`}>
                {summary.riskLevel} risk
              </span>
            </div>
            <a
              href={report.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#8888aa] text-sm font-mono hover:text-white flex items-center gap-1 break-all"
            >
              {report.targetUrl}
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </a>
            <div className="flex items-center gap-4 mt-2 text-xs text-[#4a4a6a]">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(report.generatedAt).toLocaleString()}
              </span>
              <span>Duration: {(report.duration / 1000).toFixed(1)}s</span>
            </div>
          </div>
          <button onClick={handleDownload} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Download JSON
          </button>
        </div>

        {/* AI Overview */}
        {report.aiOverview && (
          <div className="mt-5 p-4 bg-[#0a0a0f] rounded-lg border border-[#2a2a3a]">
            <p className="text-sm text-[#8888aa] leading-relaxed">{report.aiOverview}</p>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Endpoints', value: summary.totalEndpoints, color: 'text-blue-400', bg: 'bg-blue-950', border: 'border-blue-800' },
          { label: 'Critical', value: summary.criticalCount, color: 'text-red-400', bg: 'bg-red-950', border: 'border-red-800' },
          { label: 'High', value: summary.highCount, color: 'text-orange-400', bg: 'bg-orange-950', border: 'border-orange-800' },
          { label: 'Medium', value: summary.mediumCount, color: 'text-yellow-400', bg: 'bg-yellow-950', border: 'border-yellow-800' },
          { label: 'Low', value: summary.lowCount, color: 'text-green-400', bg: 'bg-green-950', border: 'border-green-800' },
          { label: 'Bias Issues', value: summary.biasIssues, color: 'text-purple-400', bg: 'bg-purple-950', border: 'border-purple-800' },
        ].map(({ label, value, color, bg, border }) => (
          <div key={label} className={`card p-4 text-center ${bg} border ${border}`}>
            <div className={`text-3xl font-bold ${color} mb-1`}>{value}</div>
            <div className="text-xs text-[#8888aa]">{label}</div>
          </div>
        ))}
      </div>

      {/* Risk Gauge + Endpoints */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 flex flex-col items-center justify-center">
          <h3 className="font-semibold text-white mb-4">Risk Score</h3>
          <RiskGauge score={report.riskScore} />
          <p className={`mt-3 font-bold text-lg ${riskColors[summary.riskLevel]}`}>
            {summary.riskLevel.toUpperCase()}
          </p>
        </div>

        <div className="lg:col-span-2 card p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-400" />
            Attack Surface ({report.endpoints.length} endpoints)
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {report.endpoints.map((ep, i) => (
              <div key={i} className="flex items-center gap-3 p-2 bg-[#0a0a0f] rounded-lg text-sm">
                <span className={`font-mono text-xs px-2 py-0.5 rounded font-bold ${
                  ep.method === 'GET' ? 'bg-blue-950 text-blue-400' :
                  ep.method === 'POST' ? 'bg-green-950 text-green-400' :
                  ep.method === 'PUT' ? 'bg-yellow-950 text-yellow-400' :
                  'bg-red-950 text-red-400'
                }`}>
                  {ep.method}
                </span>
                <span className="text-[#8888aa] font-mono text-xs truncate flex-1">{ep.url}</span>
                {ep.category && (
                  <span className="text-xs text-[#4a4a6a] bg-[#1a1a24] px-2 py-0.5 rounded">
                    {ep.category}
                  </span>
                )}
                {ep.riskScore !== undefined && (
                  <span className={`text-xs font-mono ${ep.riskScore >= 70 ? 'text-red-400' : ep.riskScore >= 40 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {ep.riskScore}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vulnerabilities */}
      {report.vulnerabilities.length > 0 && (
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
            <Bug className="w-6 h-6 text-red-400" />
            Vulnerabilities ({report.vulnerabilities.length})
          </h2>
          <div className="space-y-4">
            {report.vulnerabilities.map((vuln) => (
              <VulnCard
                key={vuln.id}
                vuln={vuln}
                expanded={expandedVuln === vuln.id}
                onToggle={() => setExpandedVuln(expandedVuln === vuln.id ? null : vuln.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Bias Findings */}
      {report.biasFindings.length > 0 && (
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
            <Scale className="w-6 h-6 text-purple-400" />
            Bias Findings ({report.biasFindings.length})
          </h2>
          <div className="space-y-4">
            {report.biasFindings.map((finding) => (
              <BiasCard
                key={finding.id}
                finding={finding}
                expanded={expandedBias === finding.id}
                onToggle={() => setExpandedBias(expandedBias === finding.id ? null : finding.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Clean bill */}
      {report.vulnerabilities.length === 0 && report.biasFindings.length === 0 && (
        <div className="card p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">No Issues Found</h3>
          <p className="text-[#8888aa]">The audited application passed all security and bias checks.</p>
        </div>
      )}
    </div>
  );
}

// ─── Vulnerability Card ───────────────────────────────────────────────────────

function VulnCard({ vuln, expanded, onToggle }: {
  vuln: VulnerabilityFinding;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={`border rounded-xl overflow-hidden transition-colors ${
      vuln.severity === 'critical' ? 'border-red-800' :
      vuln.severity === 'high' ? 'border-orange-800' :
      vuln.severity === 'medium' ? 'border-yellow-800' :
      'border-[#2a2a3a]'
    }`}>
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-4 p-5 text-left hover:bg-[#1a1a24] transition-colors"
        aria-expanded={expanded}
      >
        <SeverityBadge severity={vuln.severity} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-[#8888aa] bg-[#0a0a0f] px-2 py-0.5 rounded">
              {vuln.type}
            </span>
            {vuln.cvssScore && (
              <span className="text-xs text-[#8888aa]">CVSS {vuln.cvssScore}</span>
            )}
          </div>
          <h4 className="font-semibold text-white text-sm">{vuln.title}</h4>
          <p className="text-[#8888aa] text-xs mt-1 font-mono truncate">{vuln.endpoint}</p>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-[#8888aa] flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-[#8888aa] flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-[#2a2a3a]">
          <div className="pt-4">
            <h5 className="text-xs font-semibold text-[#8888aa] uppercase tracking-wider mb-2">Description</h5>
            <p className="text-sm text-[#e8e8f0] leading-relaxed">{vuln.description}</p>
          </div>

          {vuln.aiExplanation && (
            <div>
              <h5 className="text-xs font-semibold text-[#8888aa] uppercase tracking-wider mb-2">AI Analysis</h5>
              <p className="text-sm text-[#e8e8f0] leading-relaxed whitespace-pre-line">{vuln.aiExplanation}</p>
            </div>
          )}

          <div>
            <h5 className="text-xs font-semibold text-[#8888aa] uppercase tracking-wider mb-2">Remediation</h5>
            <p className="text-sm text-green-400 leading-relaxed">{vuln.remediation}</p>
          </div>

          <ProofViewer proof={vuln.proof} />
        </div>
      )}
    </div>
  );
}

// ─── Bias Card ────────────────────────────────────────────────────────────────

function BiasCard({ finding, expanded, onToggle }: {
  finding: BiasFinding;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-purple-800 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-4 p-5 text-left hover:bg-[#1a1a24] transition-colors"
        aria-expanded={expanded}
      >
        <SeverityBadge severity={finding.severity} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-purple-400 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
              {finding.attribute}
            </span>
            <span className="text-xs text-[#8888aa]">
              Disparity: {Math.round(finding.disparityScore * 100)}%
            </span>
          </div>
          <h4 className="font-semibold text-white text-sm">{finding.title}</h4>
          <p className="text-[#8888aa] text-xs mt-1 font-mono truncate">{finding.endpoint}</p>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-[#8888aa] flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-[#8888aa] flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-purple-800">
          <div className="pt-4">
            <p className="text-sm text-[#e8e8f0] leading-relaxed">{finding.description}</p>
          </div>

          {finding.aiExplanation && (
            <div>
              <h5 className="text-xs font-semibold text-[#8888aa] uppercase tracking-wider mb-2">AI Analysis</h5>
              <p className="text-sm text-[#e8e8f0] leading-relaxed whitespace-pre-line">{finding.aiExplanation}</p>
            </div>
          )}

          <BiasChart testCases={finding.testCases} attribute={finding.attribute} />

          {/* Test case evidence */}
          <div>
            <h5 className="text-xs font-semibold text-[#8888aa] uppercase tracking-wider mb-3">Test Evidence</h5>
            <div className="space-y-3">
              {finding.testCases.filter((tc) => tc.disparity).map((tc) => (
                <div key={tc.testCaseId} className="bg-[#0a0a0f] rounded-lg p-4 border border-[#2a2a3a]">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-purple-400 font-semibold mb-2">{tc.personaA.label}</p>
                      <pre className="text-xs text-[#8888aa] overflow-auto">
                        {JSON.stringify(tc.responseA.body, null, 2).slice(0, 200)}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs text-purple-400 font-semibold mb-2">{tc.personaB.label}</p>
                      <pre className="text-xs text-[#8888aa] overflow-auto">
                        {JSON.stringify(tc.responseB.body, null, 2).slice(0, 200)}
                      </pre>
                    </div>
                  </div>
                  <p className="text-xs text-yellow-400 mt-3 border-t border-[#2a2a3a] pt-3">
                    ⚠ {tc.disparityDetails}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
