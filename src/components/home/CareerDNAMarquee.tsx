import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { IconDna, IconArrowRight } from '@/lib/icons';

/**
 * Modern 2026-style marquee banner for Career DNA test.
 * Sleek, gradient, smooth infinite scroll - fully clickable.
 * Positioned perfectly between hero and stats sections.
 */
export function CareerDNAMarquee() {
  const { language, direction } = useLanguage();

  const messages = language === 'ar' 
    ? [
        'هل انت في الوظيفة المناسبة لك؟',
        'اختبار مجاني • نتائج فورية • مسار واضح',
        'ابدأ رحلتك المهنية الآن',
      ]
    : [
        'Discover your Career DNA in 90 seconds',
        'Free test • Instant results • Clear path',
        'Start your career journey now',
      ];

  // Duplicate messages for seamless loop
  const marqueeItems = [...messages, ...messages, ...messages];

  return (
    <Link
      to="/career-dna"
      className="group block"
    >
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden border-y border-border bg-muted/50 py-4 transition-colors hover:bg-muted/70 cursor-pointer sm:py-5"
      >
        <div className="container mx-auto px-4 sm:px-6">
          <div className={`flex items-center gap-4 sm:gap-6 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
            <div className="flex shrink-0 items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity group-hover:opacity-90 sm:px-5 sm:py-2.5">
              <IconDna className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{language === 'ar' ? 'ابدأ الاختبار' : 'Take Test'}</span>
              <span className="sm:hidden">{language === 'ar' ? 'ابدأ' : 'Start'}</span>
              <IconArrowRight className="h-4 w-4 shrink-0 rtl:rotate-180" />
            </div>

            <div className="relative flex min-w-0 flex-1 items-center overflow-hidden" dir="ltr">
              <div
                className={`flex gap-8 whitespace-nowrap ${direction === 'rtl' ? 'animate-marquee-rtl' : 'animate-marquee'}`}
                style={{ width: 'max-content' }}
              >
                {marqueeItems.map((message, i) => (
                  <div key={`${i}-${message}`} className="flex shrink-0 items-center px-2">
                    <span
                      className="text-sm font-medium text-foreground sm:text-base"
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                    >
                      {message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </Link>
  );
}
