interface RiskGaugeProps {
  score: number; // 0-100
}

export function RiskGauge({ score }: RiskGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score));

  // SVG arc gauge
  const radius = 70;
  const strokeWidth = 12;
  const cx = 90;
  const cy = 90;
  const startAngle = -210;
  const endAngle = 30;
  const totalAngle = endAngle - startAngle;
  const scoreAngle = startAngle + (clampedScore / 100) * totalAngle;

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const arcPath = (start: number, end: number) => {
    const x1 = cx + radius * Math.cos(toRad(start));
    const y1 = cy + radius * Math.sin(toRad(start));
    const x2 = cx + radius * Math.cos(toRad(end));
    const y2 = cy + radius * Math.sin(toRad(end));
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  const color =
    clampedScore >= 75 ? '#dc2626' :
    clampedScore >= 50 ? '#ea580c' :
    clampedScore >= 25 ? '#d97706' :
    '#16a34a';

  return (
    <div className="relative" aria-label={`Risk score: ${clampedScore} out of 100`}>
      <svg width="180" height="130" viewBox="0 0 180 130">
        {/* Background arc */}
        <path
          d={arcPath(startAngle, endAngle)}
          fill="none"
          stroke="#2a2a3a"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Score arc */}
        {clampedScore > 0 && (
          <path
            d={arcPath(startAngle, scoreAngle)}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}
        {/* Score text */}
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          fill="white"
          fontSize="28"
          fontWeight="bold"
          fontFamily="monospace"
        >
          {clampedScore}
        </text>
        <text
          x={cx}
          y={cy + 28}
          textAnchor="middle"
          fill="#8888aa"
          fontSize="11"
        >
          / 100
        </text>
      </svg>
    </div>
  );
}
