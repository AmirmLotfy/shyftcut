import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export function CreateRoadmapFAB() {
  const { language, direction } = useLanguage();
  const isRtl = direction === 'rtl';

  return (
    <Link
      to="/wizard"
      className={cn(
        'fixed z-30 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        'bg-primary text-primary-foreground btn-glow',
        'bottom-6',
        isRtl ? 'left-6' : 'right-6'
      )}
      style={{
        bottom: 'max(1.5rem, env(safe-area-inset-bottom))',
        ...(isRtl
          ? { left: 'max(1.5rem, env(safe-area-inset-left))' }
          : { right: 'max(1.5rem, env(safe-area-inset-right))' }),
      }}
      aria-label={language === 'ar' ? 'إنشاء خريطة طريق' : 'Create roadmap'}
    >
      <Plus className="h-6 w-6" />
    </Link>
  );
}
