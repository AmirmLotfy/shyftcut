import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { getUpgradePath } from '@/lib/upgrade-link';

interface UsageBadgeProps {
  remaining: number;
  limit: number;
  type: 'chat' | 'roadmap';
}

export function UsageBadge({ remaining, limit, type }: UsageBadgeProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  
  // Don't show for unlimited
  if (remaining === -1) return null;
  
  const isLow = remaining <= Math.ceil(limit * 0.3);
  const isEmpty = remaining === 0;
  
  return (
    <Link to={getUpgradePath(user)} className="group">
      <Badge 
        variant={isEmpty ? 'destructive' : isLow ? 'secondary' : 'outline'}
        className="gap-1 transition-all group-hover:bg-primary group-hover:text-primary-foreground"
      >
        {isEmpty ? (
          <>
            <Crown className="h-3 w-3" />
            {language === 'ar' ? 'ترقية' : 'Upgrade'}
          </>
        ) : (
          <>
            {remaining}/{limit}
            <span className="hidden sm:inline">
              {language === 'ar' 
                ? (type === 'chat' ? ' رسائل' : ' خرائط') 
                : (type === 'chat' ? ' msgs' : ' roadmaps')}
            </span>
          </>
        )}
      </Badge>
    </Link>
  );
}
