import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ReferrerChartProps {
  data: Array<{ domain: string; count: number }>;
}

export function ReferrerChart({ data }: ReferrerChartProps) {
  // Limit to top 10 for readability
  const displayData = data.slice(0, 10);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={displayData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
        <YAxis
          type="category"
          dataKey="domain"
          width={150}
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
        <Bar dataKey="count" fill="hsl(var(--primary))" name="Visits" />
      </BarChart>
    </ResponsiveContainer>
  );
}
