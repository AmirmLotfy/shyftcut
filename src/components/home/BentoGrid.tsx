import { BentoCard } from '@/components/home/BentoCard';
import {
  IconMapTrifold,
  IconClockTabler,
  IconChartBarTabler,
  IconMessageSquare,
  IconBook2,
  IconLightning,
  IconCheckCircle,
} from '@/lib/icons';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export function BentoGrid() {
  const { language, t } = useLanguage();

  const items = [
    {
      size: 'large' as const,
      delay: 0,
      icon: IconMapTrifold,
      title: t('features.ai.title'),
      description: t('features.ai.description'),
      gradient: 'from-primary to-primary-glow',
      extra: language === 'ar' ? 'تفاعلي • 90 ثانية' : 'Interactive • 90 seconds',
      bullets: true,
    },
    {
      size: 'default' as const,
      delay: 0.05,
      icon: IconClockTabler,
      title: language === 'ar' ? '12 أسبوع' : '12-Week Structure',
      description: language === 'ar' ? 'مسار منظم أسبوعاً بأسبوع' : 'Structured week-by-week path',
      gradient: 'from-accent to-cyan-400',
    },
    {
      size: 'default' as const,
      delay: 0.1,
      icon: IconBook2,
      title: language === 'ar' ? '50+ منصة' : '50+ Platforms',
      description: language === 'ar' ? 'دورات موثقة' : 'Verified courses',
      gradient: 'from-success to-emerald-400',
    },
    {
      size: 'wide' as const,
      delay: 0.15,
      icon: IconChartBarTabler,
      title: t('features.progress.title'),
      description: t('features.progress.description'),
      gradient: 'from-warning to-orange-400',
    },
    {
      size: 'default' as const,
      delay: 0.2,
      icon: IconLightning,
      title: language === 'ar' ? 'اختبارات' : 'Quiz System',
      description: language === 'ar' ? 'اختبر فهمك أسبوعياً' : 'Test your understanding weekly',
      gradient: 'from-primary to-primary-glow',
    },
    {
      size: 'default' as const,
      delay: 0.25,
      icon: IconMessageSquare,
      title: t('features.chat.title'),
      description: t('features.chat.description'),
      gradient: 'from-accent to-cyan-400',
    },
    {
      size: 'default' as const,
      delay: 0.3,
      icon: IconBook2,
      title: language === 'ar' ? 'مكتبة الدورات' : 'Course Library',
      description: language === 'ar' ? 'آلاف الدورات الموثقة' : 'Thousands of verified courses',
      gradient: 'from-success to-emerald-400',
    },
    {
      size: 'default' as const,
      delay: 0.35,
      icon: IconClockTabler,
      title: t('features.study.title'),
      description: t('features.study.description'),
      gradient: 'from-warning to-orange-400',
    },
  ];

  const placements = [
    'md:col-start-1 md:row-start-1 md:col-span-2 md:row-span-2',
    'md:col-start-3 md:row-start-1',
    'md:col-start-4 md:row-start-1',
    'md:col-start-3 md:row-start-2 md:col-span-2',
    'md:col-start-1 md:row-start-3',
    'md:col-start-2 md:row-start-3',
    'md:col-start-3 md:row-start-3',
    'md:col-start-4 md:row-start-3',
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-4 md:grid-rows-3 md:auto-rows-fr md:gap-5">
      {items.map((item, index) => {
        const Icon = item.icon;
        const showBullets = 'bullets' in item && item.bullets;
        return (
          <BentoCard key={index} size={item.size} delay={item.delay} placement={placements[index]}>
            <div
              className={cn(
                'mb-3 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white',
                item.gradient
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mb-1 text-base font-semibold md:text-lg">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.description}</p>
            {'extra' in item && item.extra && (
              <p className="mt-2 text-xs font-medium text-primary">{item.extra}</p>
            )}
            {showBullets && (
              <ul className="mt-4 flex flex-1 flex-col justify-end gap-2 border-t border-border/50 pt-4">
                <li className="flex items-start gap-2 text-xs text-muted-foreground">
                  <IconCheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/80" />
                  <span>{t('features.ai.bullet1')}</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-muted-foreground">
                  <IconCheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/80" />
                  <span>{t('features.ai.bullet2')}</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-muted-foreground">
                  <IconCheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/80" />
                  <span>{t('features.ai.bullet3')}</span>
                </li>
              </ul>
            )}
          </BentoCard>
        );
      })}
    </div>
  );
}
