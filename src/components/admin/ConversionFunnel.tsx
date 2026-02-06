import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ConversionFunnelProps {
  data: Array<{ stage: string; count: number; conversionRate: number }>;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--primary))',
  'hsl(var(--primary))',
  'hsl(var(--primary))',
  'hsl(var(--primary))',
];

export function ConversionFunnel({ data }: ConversionFunnelProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} layout="vertical">
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
          formatter={(value: number) => [value.toLocaleString(), 'Users']}
        />
        <Bar dataKey="count" radius={[0, 8, 8, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
