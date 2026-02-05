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
        'اكتشف حمضك النووي المهني في 90 ثانية',
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
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden border-y-2 border-primary/30 bg-gradient-to-r from-primary/15 via-primary/10 to-primary/15 py-5 shadow-lg shadow-primary/10 backdrop-blur-md transition-all hover:border-primary/40 hover:from-primary/20 hover:via-primary/15 hover:to-primary/20 hover:shadow-xl hover:shadow-primary/15 cursor-pointer sm:py-6"
      >
        {/* Subtle animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/8 to-transparent opacity-60" />
        
        {/* Professional glow effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5" />
        
        <div className="container relative z-10 mx-auto px-4 sm:px-6">
          <div className={`flex items-center gap-5 sm:gap-8 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
            {/* CTA Button - Enhanced visibility */}
            <div className="relative z-10 flex shrink-0 items-center gap-2.5 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-xl shadow-primary/40 transition-all group-hover:scale-105 group-hover:bg-primary/95 group-hover:shadow-2xl group-hover:shadow-primary/50 active:scale-95 sm:px-6 sm:py-3 sm:text-base">
              <IconDna className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">{language === 'ar' ? 'ابدأ الاختبار' : 'Take Test'}</span>
              <span className="sm:hidden">{language === 'ar' ? 'ابدأ' : 'Start'}</span>
              <IconArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
            </div>

            {/* Scrolling Marquee - Enhanced typography */}
            <div className="relative flex min-w-0 flex-1 items-center overflow-hidden">
              <div
                className="flex gap-10 whitespace-nowrap"
                style={{
                  animation: direction === 'rtl' 
                    ? 'marquee-rtl 30s linear infinite'
                    : 'marquee 30s linear infinite',
                }}
              >
                {marqueeItems.map((message, i) => (
                  <div
                    key={`${i}-${message}`}
                    className="flex shrink-0 items-center px-3"
                  >
                    <span className="text-base font-semibold text-foreground transition-colors group-hover:text-foreground sm:text-lg">
                      {message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced gradient fade edges */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-0 w-24 bg-gradient-to-r from-primary/15 via-primary/15 to-transparent"
          style={{ direction: 'ltr' }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-0 w-24 bg-gradient-to-l from-primary/15 via-primary/15 to-transparent"
          style={{ direction: 'ltr' }}
          aria-hidden
        />
      </motion.section>
    </Link>
  );
}
