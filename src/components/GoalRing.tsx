/** SVG 圆环进度 */
export function GoalRing({
  value, size = 96, stroke = 10, color = "#F26A55", track = "#F0E4D6", label,
}: { value: number; size?: number; stroke?: number; color?: string; track?: string; label?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v)}
          style={{ transition: "stroke-dashoffset .6s cubic-bezier(.34,1.56,.64,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{label}</div>
    </div>
  );
}
