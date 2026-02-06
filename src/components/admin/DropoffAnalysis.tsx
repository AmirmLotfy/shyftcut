import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DropoffAnalysisProps {
  data: Array<{ page: string; count: number }>;
}

export function DropoffAnalysis({ data }: DropoffAnalysisProps) {
  // Limit to top 15 for readability
  const displayData = data.slice(0, 15);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={displayData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
        <YAxis
          type="category"
          dataKey="page"
          width={200}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          formatter={(value: number) => [value.toLocaleString(), 'Drop-offs']}
        />
        <Bar dataKey="count" fill="hsl(var(--destructive))" name="Drop-offs" />
      </BarChart>
    </ResponsiveContainer>
  );
}
