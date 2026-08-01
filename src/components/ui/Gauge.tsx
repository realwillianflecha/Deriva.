export default function Gauge({
  label,
  value,
  max,
  unit = '',
  danger = false,
}: {
  label: string;
  value: number;
  max: number;
  unit?: string;
  danger?: boolean;
}) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-wide text-white/60">
        <span>{label}</span>
        <span className={danger ? 'text-red-400' : 'text-white/80'}>
          {value.toFixed(1)}
          {unit}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-[width] duration-100 ${danger ? 'bg-red-400' : 'bg-emerald-400'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
