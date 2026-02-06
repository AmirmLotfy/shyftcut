import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface FunnelAnalysisProps {
  data: Array<{ stage: string; count: number; dropOff: number }>;
}

export function FunnelAnalysis({ data }: FunnelAnalysisProps) {
  const chartData = data.map(item => ({
    stage: item.stage,
    users: item.count,
    dropOff: item.dropOff,
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
        <YAxis
          type="category"
          dataKey="stage"
          width={120}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
        />
        <Legend />
        <Bar dataKey="users" fill="hsl(var(--primary))" name="Users" />
        <Bar dataKey="dropOff" fill="hsl(var(--destructive))" name="Drop-offs" />
      </BarChart>
    </ResponsiveContainer>
  );
}
