import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserActivityTimelineProps {
  timeline: Array<{ type: string; timestamp: string; data: unknown }>;
}

export function UserActivityTimeline({ timeline }: UserActivityTimelineProps) {
  const { language } = useLanguage();

  if (timeline.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        {language === 'ar' ? 'لا توجد أنشطة' : 'No activities'}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {timeline.map((item, index) => {
        const date = new Date(item.timestamp);
        const data = item.data as Record<string, unknown>;
        
        return (
          <div key={index} className="flex gap-4 pb-4 border-b last:border-0">
            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{item.type}</Badge>
                <span className="text-sm text-muted-foreground">
                  {date.toLocaleString()}
                </span>
              </div>
              <div className="text-sm">
                {item.type === 'event' && (
                  <p>
                    {language === 'ar' ? 'حدث:' : 'Event:'} {(data.event_name as string) || '-'} - {(data.page_path as string) || '-'}
                  </p>
                )}
                {item.type === 'conversion' && (
                  <p>
                    {language === 'ar' ? 'تحويل:' : 'Conversion:'} {(data.conversion_type as string) || '-'} - {(data.funnel_stage as string) || '-'}
                  </p>
                )}
                {item.type === 'roadmap' && (
                  <p>
                    {language === 'ar' ? 'خارطة طريق:' : 'Roadmap:'} {(data.title as string) || '-'}
                  </p>
                )}
                {item.type === 'subscription_event' && (
                  <p>
                    {language === 'ar' ? 'حدث اشتراك:' : 'Subscription Event:'} {(data.event_type as string) || '-'}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
