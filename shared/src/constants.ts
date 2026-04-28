export const SEVERITY_COLORS = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#d97706',
  low: '#65a30d',
  info: '#0284c7',
} as const;

export const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info'] as const;

export const VULN_DESCRIPTIONS: Record<string, string> = {
  IDOR: 'Insecure Direct Object Reference — attacker accesses resources belonging to other users by manipulating identifiers.',
  AUTH_BYPASS: 'Authentication/Authorization Bypass — attacker accesses protected resources without valid credentials.',
  INPUT_VALIDATION: 'Input Validation Flaw — application accepts malformed or malicious input without proper sanitization.',
  TOKEN_MISUSE: 'Token Misuse — authentication tokens are predictable, reusable, or improperly validated.',
  WORKFLOW_BYPASS: 'Workflow Bypass — attacker skips required steps in a multi-step business process.',
  REPLAY_ATTACK: 'Replay Attack — previously captured requests can be replayed to repeat actions.',
  INVALID_STATE: 'Invalid State Transition — application allows operations in states where they should be forbidden.',
};

export const DEFAULT_SCAN_OPTIONS = {
  maxDepth: 3,
  maxEndpoints: 50,
  enableBiasDetection: true,
  enableVulnTesting: true,
  timeout: 10000,
};

export const BIAS_ATTRIBUTES = [
  'gender',
  'age',
  'region',
  'ethnicity',
  'income_level',
  'education',
] as const;
