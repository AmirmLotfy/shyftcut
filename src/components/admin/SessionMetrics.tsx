import { Card, CardContent } from '@/components/ui/card';

interface SessionMetricsProps {
  metrics: {
    totalSessions: number;
    avgDuration: number;
    avgPagesPerSession: number;
    bounceRate: number;
    conversionRate: number;
  };
}

export function SessionMetrics({ metrics }: SessionMetricsProps) {
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Total Sessions</p>
          <p className="text-2xl font-bold mt-1">{metrics.totalSessions.toLocaleString()}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Avg Duration</p>
          <p className="text-2xl font-bold mt-1">{formatDuration(metrics.avgDuration)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Pages/Session</p>
          <p className="text-2xl font-bold mt-1">{metrics.avgPagesPerSession.toFixed(1)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Bounce Rate</p>
          <p className="text-2xl font-bold mt-1">{metrics.bounceRate.toFixed(1)}%</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Conversion Rate</p>
          <p className="text-2xl font-bold mt-1">{metrics.conversionRate.toFixed(1)}%</p>
        </CardContent>
      </Card>
    </div>
  );
}
