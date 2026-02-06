import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ConversionRatesProps {
  data: Array<{ stage: string; count: number; conversionRate: number }>;
}

export function ConversionRates({ data }: ConversionRatesProps) {
  const chartData = data.map(item => ({
    stage: item.stage,
    rate: item.conversionRate,
    count: item.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="stage"
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
          label={{ value: 'Rate (%)', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          formatter={(value: number) => [`${value.toFixed(2)}%`, 'Conversion Rate']}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="rate"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ r: 4 }}
          name="Conversion Rate (%)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
