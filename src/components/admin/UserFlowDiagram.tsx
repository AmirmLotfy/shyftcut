import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface UserFlowDiagramProps {
  data: Array<{ from: string; to: Array<{ to: string; count: number }> }>;
}

export function UserFlowDiagram({ data }: UserFlowDiagramProps) {
  // Flatten the flow data for visualization
  const flowData: Array<{ path: string; count: number }> = [];
  
  data.forEach((item) => {
    item.to.forEach((to) => {
      flowData.push({
        path: `${item.from} → ${to.to}`,
        count: to.count,
      });
    });
  });

  // Sort by count and take top 15
  const sortedData = flowData
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={sortedData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
        <YAxis
          type="category"
          dataKey="path"
          width={200}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
        />
        <Bar dataKey="count" fill="hsl(var(--primary))" name="Users" />
      </BarChart>
    </ResponsiveContainer>
  );
}
