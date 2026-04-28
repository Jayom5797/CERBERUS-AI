import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BiasTestResult } from '@cerberus/shared';

interface BiasChartProps {
  testCases: BiasTestResult[];
  attribute: string;
}

export function BiasChart({ testCases, attribute }: BiasChartProps) {
  if (testCases.length === 0) return null;

  // Build comparison data
  const data = testCases.map((tc, i) => {
    const scoreA = extractScore(tc.responseA.body);
    const scoreB = extractScore(tc.responseB.body);

    return {
      name: `Trial ${i + 1}`,
      [tc.personaA.label]: scoreA,
      [tc.personaB.label]: scoreB,
      disparity: tc.disparity,
    };
  });

  const labelA = testCases[0]?.personaA.label ?? 'Group A';
  const labelB = testCases[0]?.personaB.label ?? 'Group B';

  return (
    <div>
      <h5 className="text-xs font-semibold text-[#8888aa] uppercase tracking-wider mb-3">
        Decision Comparison — {attribute}
      </h5>
      <div className="bg-[#0a0a0f] rounded-lg p-4 border border-[#2a2a3a]">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} barGap={4}>
            <XAxis dataKey="name" tick={{ fill: '#8888aa', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#8888aa', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#16161f', border: '1px solid #2a2a3a', borderRadius: 8 }}
              labelStyle={{ color: '#e8e8f0' }}
              itemStyle={{ color: '#8888aa' }}
            />
            <Bar dataKey={labelA} fill="#7c3aed" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.disparity ? '#7c3aed' : '#4c1d95'} />
              ))}
            </Bar>
            <Bar dataKey={labelB} fill="#a855f7" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.disparity ? '#a855f7' : '#6b21a8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2 justify-center">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#7c3aed]" />
            <span className="text-xs text-[#8888aa]">{labelA}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#a855f7]" />
            <span className="text-xs text-[#8888aa]">{labelB}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function extractScore(body: unknown): number {
  if (!body || typeof body !== 'object') return 0;
  const obj = body as Record<string, unknown>;
  const scoreFields = ['score', 'probability', 'confidence', 'rating', 'risk_score', 'approved'];
  for (const field of scoreFields) {
    if (field in obj) {
      const val = obj[field];
      if (typeof val === 'number') return Math.round(val * 100) / 100;
      if (typeof val === 'boolean') return val ? 1 : 0;
    }
  }
  return 0;
}
