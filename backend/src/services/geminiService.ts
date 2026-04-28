import {
  DiscoveredEndpoint,
  EndpointCategory,
  VulnerabilityFinding,
  BiasFinding,
} from '@cerberus/shared';

type GeminiModel = {
  generateContent: (prompt: string) => Promise<{ response: { text: () => string } }>;
};

/**
 * GeminiService — uses Vertex AI when running on GCP (no API key needed),
 * falls back to Google AI Studio key if GEMINI_API_KEY is set,
 * otherwise uses heuristic fallbacks.
 */
export class GeminiService {
  private model: GeminiModel | null = null;
  private ready = false;

  constructor() {
    this.init();
  }

  private init(): void {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;

    // Option 1: Vertex AI (runs on GCP with service account — no key needed)
    if (projectId) {
      try {
        // Dynamic import to avoid hard crash if package missing
        const { VertexAI } = require('@google-cloud/vertexai');
        const vertex = new VertexAI({ project: projectId, location: 'us-central1' });
        const generativeModel = vertex.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Wrap to match our interface
        this.model = {
          generateContent: async (prompt: string) => {
            const result = await generativeModel.generateContent(prompt);
            const response = await result.response;
            return {
              response: {
                text: () => response.candidates?.[0]?.content?.parts?.[0]?.text ?? '',
              },
            };
          },
        };
        this.ready = true;
        console.log('[Gemini] Using Vertex AI (project: ' + projectId + ')');
        return;
      } catch (err) {
        console.warn('[Gemini] Vertex AI init failed:', (err as Error).message);
      }
    }

    // Option 2: Google AI Studio API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);
        const m = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        this.model = {
          generateContent: async (prompt: string) => {
            const result = await m.generateContent(prompt);
            return { response: { text: () => result.response.text() } };
          },
        };
        this.ready = true;
        console.log('[Gemini] Using Google AI Studio API key');
        return;
      } catch (err) {
        console.warn('[Gemini] API key init failed:', (err as Error).message);
      }
    }

    console.warn('[Gemini] No AI available — using heuristic fallbacks');
  }

  private async generate(prompt: string): Promise<string | null> {
    if (!this.model) return null;
    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text().trim();
      return text || null;
    } catch (err) {
      console.warn('[Gemini] generateContent failed:', (err as Error).message);
      return null;
    }
  }

  // ─── Endpoint Classification ──────────────────────────────────────────────

  async classifyEndpoints(endpoints: DiscoveredEndpoint[]): Promise<DiscoveredEndpoint[]> {
    if (!this.ready || endpoints.length === 0) {
      return endpoints.map((e) => ({ ...e, category: this.heuristicCategory(e), riskScore: this.heuristicRisk(e) }));
    }

    const prompt = `You are a security analyst. Classify each API endpoint by category and risk score.

Categories: auth, user_data, payment, admin, search, file, decision, unknown

Endpoints:
${endpoints.map((e, i) => `${i}. ${e.method} ${e.url}`).join('\n')}

Respond with a JSON array (same order). Each item:
{ "category": "<category>", "riskScore": <0-100>, "intent": "<one sentence>" }

Only valid JSON array, no markdown, no explanation.`;

    const text = await this.generate(prompt);
    if (!text) return endpoints.map((e) => ({ ...e, category: this.heuristicCategory(e), riskScore: this.heuristicRisk(e) }));

    try {
      // Strip markdown code fences if present
      const clean = text.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
      const classifications = JSON.parse(clean) as Array<{
        category: EndpointCategory;
        riskScore: number;
        intent: string;
      }>;
      return endpoints.map((e, i) => ({
        ...e,
        category: classifications[i]?.category ?? this.heuristicCategory(e),
        riskScore: classifications[i]?.riskScore ?? this.heuristicRisk(e),
      }));
    } catch {
      return endpoints.map((e) => ({ ...e, category: this.heuristicCategory(e), riskScore: this.heuristicRisk(e) }));
    }
  }

  // ─── Vulnerability Explanation ────────────────────────────────────────────

  async explainVulnerability(finding: Partial<VulnerabilityFinding>): Promise<string> {
    if (!this.ready) return this.fallbackVulnExplanation(finding);

    const prompt = `You are a security expert. Explain this vulnerability for a developer.

Type: ${finding.type}
Endpoint: ${finding.endpoint}
Description: ${finding.description}

Provide:
1. Root cause (2-3 sentences)
2. Business impact (1-2 sentences)  
3. Step-by-step fix (3-5 bullet points)

Plain text only, no markdown headers.`;

    const text = await this.generate(prompt);
    return text ?? this.fallbackVulnExplanation(finding);
  }

  // ─── Bias Explanation ─────────────────────────────────────────────────────

  async explainBias(finding: Partial<BiasFinding>): Promise<string> {
    if (!this.ready) return `Bias detected in ${finding.attribute} attribute. Disparity score: ${finding.disparityScore?.toFixed(2)}.`;

    const prompt = `You are an AI fairness expert. Explain this bias finding.

Attribute: ${finding.attribute}
Endpoint: ${finding.endpoint}
Disparity Score: ${finding.disparityScore}
Description: ${finding.description}

Provide:
1. What bias was detected (2-3 sentences)
2. Potential real-world harm (1-2 sentences)
3. How to fix it (3-4 bullet points)

Plain text only, no markdown headers.`;

    const text = await this.generate(prompt);
    return text ?? `Bias detected in ${finding.attribute}. Disparity: ${finding.disparityScore?.toFixed(2)}.`;
  }

  // ─── Audit Overview ───────────────────────────────────────────────────────

  async generateAuditOverview(params: {
    targetUrl: string;
    endpoints: DiscoveredEndpoint[];
    vulnerabilities: VulnerabilityFinding[];
    biasFindings: BiasFinding[];
  }): Promise<string> {
    if (!this.ready) {
      return `CERBERUS-AI completed audit of ${params.targetUrl}. Found ${params.vulnerabilities.length} vulnerabilities and ${params.biasFindings.length} bias issues across ${params.endpoints.length} endpoints.`;
    }

    const criticalVulns = params.vulnerabilities.filter((v) => v.severity === 'critical' || v.severity === 'high');

    const prompt = `You are a senior security auditor. Write an executive summary for this AI system audit.

Target: ${params.targetUrl}
Endpoints Discovered: ${params.endpoints.length}
Total Vulnerabilities: ${params.vulnerabilities.length}
Critical/High: ${criticalVulns.length}
Bias Issues: ${params.biasFindings.length}
Top Issues:
${criticalVulns.slice(0, 3).map((v) => `- ${v.type}: ${v.title}`).join('\n') || '- None'}

Write 3-4 sentences covering: overall risk posture, most critical findings, recommended immediate actions. Plain text only.`;

    const text = await this.generate(prompt);
    return text ?? `Audit of ${params.targetUrl} completed. ${params.vulnerabilities.length} vulnerabilities and ${params.biasFindings.length} bias issues detected.`;
  }

  // ─── Bias Personas ────────────────────────────────────────────────────────

  /**
   * Generate paired test personas using Gemini, adapted to the endpoint's
   * actual known body schema so field names match what the API expects.
   */
  async generateBiasPersonas(
    endpoint: DiscoveredEndpoint,
    attribute: string
  ): Promise<Array<{ label: string; payload: Record<string, unknown> }>> {
    if (!this.ready) return this.fallbackPersonas(attribute, endpoint.bodySchema);

    const schemaHint = endpoint.bodySchema
      ? `Known request body fields: ${JSON.stringify(endpoint.bodySchema)}`
      : 'No known body schema — infer realistic fields from the endpoint URL.';

    const prompt = `Generate 2 test personas for bias testing an AI decision API endpoint.

Endpoint: ${endpoint.method} ${endpoint.url}
Bias Attribute: ${attribute}
${schemaHint}

Rules:
- Both personas MUST be identical in every field EXCEPT "${attribute}"
- Use the actual field names from the schema if provided
- Values must be realistic for a real API submission
- If schema uses "applicant_gender" use that, not "gender"

Respond with ONLY a JSON array of exactly 2 objects:
[{"label":"<GroupA>","payload":{...}},{"label":"<GroupB>","payload":{...}}]
No markdown, no explanation.`;

    const text = await this.generate(prompt);
    if (!text) return this.fallbackPersonas(attribute, endpoint.bodySchema);

    try {
      const clean = text.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed) && parsed.length >= 2) return parsed.slice(0, 2);
    } catch {
      // fall through
    }
    return this.fallbackPersonas(attribute, endpoint.bodySchema);
  }

  // ─── Infer body schema field names from a response ───────────────────────

  async inferRequestFields(
    endpoint: DiscoveredEndpoint,
    sampleResponse: unknown
  ): Promise<Record<string, string>> {
    if (!this.ready) return {};

    const prompt = `An API endpoint returned this response:
${JSON.stringify(sampleResponse).slice(0, 500)}

Endpoint: ${endpoint.method} ${endpoint.url}

What request body fields does this endpoint likely accept?
Respond with ONLY a JSON object mapping field names to their types.
Example: {"name":"string","age":"number","approved":"boolean"}
No markdown, no explanation.`;

    const text = await this.generate(prompt);
    if (!text) return {};
    try {
      const clean = text.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
      return JSON.parse(clean);
    } catch {
      return {};
    }
  }

  // ─── Heuristics ───────────────────────────────────────────────────────────

  private heuristicCategory(endpoint: DiscoveredEndpoint): EndpointCategory {
    const url = endpoint.url.toLowerCase();
    if (/login|auth|signin|token|oauth|jwt/.test(url)) return 'auth';
    if (/user|profile|account|me|member/.test(url)) return 'user_data';
    if (/pay|payment|charge|billing|invoice|card|wallet/.test(url)) return 'payment';
    if (/admin|manage|dashboard|internal|staff/.test(url)) return 'admin';
    if (/search|query|find|filter|lookup/.test(url)) return 'search';
    if (/file|upload|download|attachment|media/.test(url)) return 'file';
    if (/decision|approve|reject|score|predict|loan|hire|apply|assess/.test(url)) return 'decision';
    return 'unknown';
  }

  private heuristicRisk(endpoint: DiscoveredEndpoint): number {
    const cat = this.heuristicCategory(endpoint);
    const base: Record<EndpointCategory, number> = {
      admin: 90, payment: 85, auth: 80, user_data: 70,
      decision: 75, file: 60, search: 40, unknown: 50,
    };
    let score = base[cat] ?? 50;
    // POST/PUT/DELETE are higher risk than GET
    if (endpoint.method === 'POST' || endpoint.method === 'PUT') score = Math.min(100, score + 10);
    if (endpoint.method === 'DELETE') score = Math.min(100, score + 15);
    return score;
  }

  private fallbackVulnExplanation(finding: Partial<VulnerabilityFinding>): string {
    const fixes: Record<string, string> = {
      IDOR: 'Verify resource ownership server-side before returning data. Never trust client-supplied IDs without authorization checks.',
      AUTH_BYPASS: 'Add authentication middleware to all protected routes. Return 401 for unauthenticated requests.',
      INPUT_VALIDATION: 'Sanitize all inputs. Use parameterized queries. Set request size limits.',
      TOKEN_MISUSE: 'Use short-lived signed tokens. Validate server-side on every request.',
      WORKFLOW_BYPASS: 'Enforce state machine logic server-side. Never rely on client to enforce step order.',
      REPLAY_ATTACK: 'Add nonces or timestamps to requests. Reject replayed tokens.',
      INVALID_STATE: 'Validate allowed state transitions server-side before processing.',
    };
    const fix = fixes[finding.type ?? ''] ?? 'Review and fix the identified vulnerability immediately.';
    return `${finding.description}\n\nRemediation: ${fix}`;
  }

  private fallbackPersonas(
    attribute: string,
    bodySchema?: Record<string, unknown>
  ): Array<{ label: string; payload: Record<string, unknown> }> {
    // If we have a body schema, try to adapt field names
    const schemaKeys = bodySchema ? Object.keys(bodySchema) : [];

    // Find the actual field name for the attribute in the schema
    const findField = (candidates: string[]): string => {
      for (const c of candidates) {
        const match = schemaKeys.find((k) => k.toLowerCase().includes(c.toLowerCase()));
        if (match) return match;
      }
      return candidates[0]; // default to first candidate
    };

    const basePayload: Record<string, unknown> = {
      income: 75000,
      credit_score: 720,
      age: 35,
      loan_amount: 25000,
      employment_years: 5,
    };

    // Adapt base payload keys to schema if known
    if (schemaKeys.length > 0) {
      const incomeField = findField(['income', 'salary', 'annual_income']);
      const creditField = findField(['credit_score', 'credit', 'fico']);
      const adapted: Record<string, unknown> = {};
      if (incomeField) adapted[incomeField] = 75000;
      if (creditField) adapted[creditField] = 720;
      Object.assign(basePayload, adapted);
    }

    const personas: Record<string, Array<{ label: string; payload: Record<string, unknown> }>> = {
      gender: [
        { label: 'Male', payload: { ...basePayload, [findField(['gender', 'sex', 'applicant_gender'])]: 'male', name: 'John Smith' } },
        { label: 'Female', payload: { ...basePayload, [findField(['gender', 'sex', 'applicant_gender'])]: 'female', name: 'Jane Smith' } },
      ],
      age: [
        { label: 'Young (25)', payload: { ...basePayload, [findField(['age', 'applicant_age', 'dob'])]: 25 } },
        { label: 'Senior (60)', payload: { ...basePayload, [findField(['age', 'applicant_age', 'dob'])]: 60 } },
      ],
      region: [
        { label: 'Urban', payload: { ...basePayload, [findField(['region', 'location', 'area', 'zip'])]: 'urban' } },
        { label: 'Rural', payload: { ...basePayload, [findField(['region', 'location', 'area', 'zip'])]: 'rural' } },
      ],
      ethnicity: [
        { label: 'Group A', payload: { ...basePayload, [findField(['ethnicity', 'race', 'nationality'])]: 'group_a' } },
        { label: 'Group B', payload: { ...basePayload, [findField(['ethnicity', 'race', 'nationality'])]: 'group_b' } },
      ],
    };

    return personas[attribute] ?? [
      { label: 'Group A', payload: { ...basePayload, [attribute]: 'value_a' } },
      { label: 'Group B', payload: { ...basePayload, [attribute]: 'value_b' } },
    ];
  }
}
