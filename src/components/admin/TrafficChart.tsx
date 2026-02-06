import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface TrafficChartProps {
  data: Array<{ date: string; value: number }>;
}

export function TrafficChart({ data }: TrafficChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
          tickFormatter={(value) => {
            const date = new Date(value);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }}
        />
        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          labelFormatter={(value) => {
            const date = new Date(value);
            return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="value"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={false}
          name="Page Views"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
