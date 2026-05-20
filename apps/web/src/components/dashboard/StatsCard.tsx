interface StatsCardProps {
  emoji:     string
  label:     string
  value:     string | number
  sub?:      string
  bg?:       string
  trend?:    { value: number; label: string }
}

export function StatsCard({ emoji, label, value, sub, bg = '#D4E8F5', trend }: StatsCardProps) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-2" style={{ backgroundColor: bg }}>
      <span className="text-2xl">{emoji}</span>
      <div className="text-2xl font-bold text-[#1A1C2E] leading-tight">{value}</div>
      <div className="text-sm text-[#6B7280]">{label}</div>
      {sub && <div className="text-xs text-[#9CA3AF]">{sub}</div>}
      {trend && (
        <div className={`text-xs font-medium ${trend.value >= 0 ? 'text-[#5A9468]' : 'text-[#C05040]'}`}>
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
        </div>
      )}
    </div>
  )
}
