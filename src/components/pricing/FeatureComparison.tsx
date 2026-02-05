import { useLanguage } from '@/contexts/LanguageContext';
import { IconCheckCircle } from '@/lib/icons';

const comparison: {
  feature: { en: string; ar: string };
  free: string | boolean | { en: string; ar: string };
  premium: string | boolean | { en: string; ar: string };
}[] = [
  { feature: { en: 'Roadmaps', ar: 'خرائط الطريق' }, free: '1', premium: 'Unlimited' },
  { feature: { en: 'AI chat messages', ar: 'رسائل المحادثة الذكية' }, free: '10/mo', premium: 'Unlimited' },
  { feature: { en: 'Quizzes', ar: 'الاختبارات' }, free: '3/mo', premium: 'Unlimited' },
  { feature: { en: 'Notes', ar: 'الملاحظات' }, free: '20', premium: 'Unlimited' },
  { feature: { en: 'Tasks', ar: 'المهام' }, free: '30', premium: 'Unlimited' },
  { feature: { en: 'AI task suggestions', ar: 'اقتراحات مهام بالذكاء الاصطناعي' }, free: { en: '5/day', ar: '5/يوم' }, premium: 'Unlimited' },
  { feature: { en: 'Focus (Pomodoro) timer', ar: 'مؤقت التركيز (بومودورو)' }, free: true, premium: true },
  { feature: { en: 'Course recommendations', ar: 'توصيات الدورات' }, free: { en: '1/week', ar: '1/أسبوع' }, premium: { en: 'All', ar: 'الكل' } },
  { feature: { en: 'CV analysis', ar: 'تحليل السيرة الذاتية (CV)' }, free: false, premium: true },
  { feature: { en: 'Job recommendations (10/week)', ar: 'توصيات وظائف (10/أسبوع)' }, free: false, premium: true },
  { feature: { en: 'Progress tracking', ar: 'تتبع التقدم' }, free: true, premium: true },
  { feature: { en: 'Email support', ar: 'دعم عبر البريد الإلكتروني' }, free: true, premium: true },
];

function cellValue(
  v: string | boolean | { en: string; ar: string },
  lang: 'en' | 'ar'
): string | boolean {
  if (typeof v === 'object') return v[lang];
  return v;
}

export function FeatureComparison() {
  const { language } = useLanguage();

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
      {/* Plan headers — clear visual separation */}
      <div className="grid grid-cols-3 gap-0 border-b border-border bg-muted/40">
        <div className="px-5 py-4 text-start">
          <span className="text-sm font-semibold text-muted-foreground">
            {language === 'ar' ? 'الميزة' : 'Feature'}
          </span>
        </div>
        <div className="px-5 py-4 text-center">
          <span className="rounded-full bg-muted px-3 py-1.5 text-sm font-bold text-foreground">
            {language === 'ar' ? 'مجاني' : 'Free'}
          </span>
        </div>
        <div className="px-5 py-4 text-center">
          <span className="rounded-full bg-primary/15 px-3 py-1.5 text-sm font-bold text-primary">
            {language === 'ar' ? 'بريميوم' : 'Premium'}
          </span>
        </div>
      </div>
      <div className="divide-y divide-border/60">
        {comparison.map((row, i) => (
          <div
            key={i}
            className={`grid grid-cols-3 gap-0 text-sm ${i % 2 === 1 ? 'bg-muted/20' : ''}`}
          >
            <div className="px-5 py-4 font-medium text-foreground">
              {row.feature[language]}
            </div>
            <div className="flex items-center justify-center px-5 py-4">
              {cellValue(row.free, language) === true ? (
                <IconCheckCircle className="h-5 w-5 text-success" />
              ) : cellValue(row.free, language) === false ? (
                <span className="text-muted-foreground">—</span>
              ) : (
                <span className="text-muted-foreground">{String(cellValue(row.free, language))}</span>
              )}
            </div>
            <div className="flex items-center justify-center px-5 py-4">
              {cellValue(row.premium, language) === true ? (
                <IconCheckCircle className="h-5 w-5 text-success" />
              ) : cellValue(row.premium, language) === false ? (
                <span className="text-muted-foreground">—</span>
              ) : (
                <span className="font-semibold text-primary">{String(cellValue(row.premium, language))}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
