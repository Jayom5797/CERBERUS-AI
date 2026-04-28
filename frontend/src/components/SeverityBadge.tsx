import { Severity } from '@cerberus/shared';

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
}

const config: Record<Severity, { label: string; classes: string }> = {
  critical: { label: 'CRITICAL', classes: 'bg-red-950 text-red-400 border-red-800' },
  high: { label: 'HIGH', classes: 'bg-orange-950 text-orange-400 border-orange-800' },
  medium: { label: 'MEDIUM', classes: 'bg-yellow-950 text-yellow-400 border-yellow-800' },
  low: { label: 'LOW', classes: 'bg-green-950 text-green-400 border-green-800' },
  info: { label: 'INFO', classes: 'bg-blue-950 text-blue-400 border-blue-800' },
};

export function SeverityBadge({ severity, className = '' }: SeverityBadgeProps) {
  const { label, classes } = config[severity] ?? config.info;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border flex-shrink-0 ${classes} ${className}`}
      aria-label={`Severity: ${label}`}
    >
      {label}
    </span>
  );
}
