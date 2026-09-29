import { Bar, BarChart, ResponsiveContainer, XAxis } from "recharts";

export function WeekChart({
  data,
}: {
  data: { key: string; label: string; kept: number }[];
}) {
  return (
    <div className="h-32 w-full text-muted" role="img" aria-label="What you kept each day this week">
      <ResponsiveContainer width="100%" height={128}>
        <BarChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            interval={0}
            tick={{ fill: "currentColor", fontSize: 12 }}
          />
          <Bar
            dataKey="kept"
            fill="var(--color-jade)"
            radius={[8, 8, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
