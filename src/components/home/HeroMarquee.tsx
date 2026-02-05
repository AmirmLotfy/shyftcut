import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

const platforms = [
  { name: 'Udemy', slug: 'udemy' },
  { name: 'Coursera', slug: 'coursera' },
  { name: 'edX', slug: 'edx' },
  { name: 'LinkedIn Learning', slug: 'linkedin' },
  { name: 'Skillshare', slug: 'skillshare' },
  { name: 'Codecademy', slug: 'codecademy' },
];

function platformLogoUrl(slug: string): string {
  return `https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/${slug}.svg`;
}

export function HeroMarquee() {
  const { language } = useLanguage();
  const trustedByLabel =
    language === 'ar' ? 'منصات موثقة في خريطة طريقك' : 'Trusted learning platforms';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/40 py-6 backdrop-blur-xl dark:bg-card/60"
    >
      <h3 className="mb-5 px-6 text-sm font-medium text-muted-foreground">
        {trustedByLabel}
      </h3>
      <div
        className="relative flex overflow-hidden"
        style={{
          maskImage:
            'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
        }}
      >
        <div className="animate-marquee flex gap-10 whitespace-nowrap px-4">
          {[...platforms, ...platforms, ...platforms].map((p, i) => (
            <div
              key={`${p.slug}-${i}`}
              className="flex items-center gap-2 opacity-70 transition-all hover:opacity-100"
              role="img"
              aria-label={p.name}
            >
              <img
                src={platformLogoUrl(p.slug)}
                alt=""
                width={24}
                height={24}
                className="h-6 w-6 shrink-0 object-contain brightness-0 dark:brightness-0 dark:invert"
              />
              <span className="text-base font-bold tracking-tight text-foreground">
                {p.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
