import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { SubscriptionEvent } from '@/hooks/useAdmin';

interface SubscriptionEventsTimelineProps {
  events: SubscriptionEvent[];
}

export function SubscriptionEventsTimeline({ events }: SubscriptionEventsTimelineProps) {
  const { language } = useLanguage();

  if (events.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        {language === 'ar' ? 'لا توجد أحداث' : 'No events'}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => {
        const date = new Date(event.created_at);
        
        return (
          <div key={event.id} className="flex gap-4 pb-4 border-b last:border-0">
            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{event.event_type}</Badge>
                <span className="text-sm text-muted-foreground">
                  {date.toLocaleString()}
                </span>
              </div>
              {event.from_tier && event.to_tier && (
                <p className="text-sm">
                  {language === 'ar' ? 'من' : 'From'} {event.from_tier} {language === 'ar' ? 'إلى' : 'to'} {event.to_tier}
                </p>
              )}
              {event.amount && (
                <p className="text-sm font-medium">
                  ${event.amount.toFixed(2)} {event.currency || 'USD'}
                </p>
              )}
              {event.reason && (
                <p className="text-sm text-muted-foreground">{event.reason}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
