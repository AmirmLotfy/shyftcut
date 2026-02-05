import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { IconCheckCircle } from '@/lib/icons';

/**
 * Verified learning platforms with official logos from Simple Icons (jsDelivr CDN).
 * Fallback: show initials when image fails.
 */
const LOGO_SIZE = 28;
const platforms = [
  { name: 'Udemy', slug: 'udemy' },
  { name: 'Coursera', slug: 'coursera' },
  { name: 'Pluralsight', slug: 'pluralsight' },
  { name: 'edX', slug: 'edx' },
  { name: 'LinkedIn Learning', slug: 'linkedin' },
  { name: 'Skillshare', slug: 'skillshare' },
  { name: 'Codecademy', slug: 'codecademy' },
  { name: 'DataCamp', slug: 'datacamp' },
] as const;

function platformLogoUrl(slug: string): string {
  return `https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/${slug}.svg`;
}

/** Initials for fallback when logo fails to load (e.g. "LinkedIn Learning" → "LL"). */
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function LogoOrFallback({
  src,
  alt,
  name,
  size,
}: {
  src: string;
  alt: string;
  name: string;
  size: number;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-muted text-xs font-bold text-muted-foreground"
        aria-hidden
      >
        {getInitials(name)}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="h-7 w-7 shrink-0 rounded object-contain opacity-90 brightness-0 dark:brightness-0 dark:invert"
      onError={() => setFailed(true)}
    />
  );
}

export function PlatformIntegrations() {
  const { language } = useLanguage();

  return (
    <section className="bg-muted/20 py-10 sm:py-12 md:py-20">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6 text-start sm:mb-8"
        >
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-primary/80 sm:text-xs">
            {language === 'ar' ? '50+ منصة في خريطة طريقك' : '50+ platforms in your roadmap'}
          </p>
          <h2 className="text-xl font-bold sm:text-2xl md:text-3xl">
            {language === 'ar' ? 'منصات موثقة' : 'Verified Platform Integrations'}
          </h2>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4"
        >
          {platforms.map((platform, index) => (
            <motion.div
              key={platform.slug}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.04 }}
              className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 px-4 py-3.5 backdrop-blur-xl shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
            >
              <LogoOrFallback
                src={platformLogoUrl(platform.slug)}
                alt=""
                name={platform.name}
                size={LOGO_SIZE}
              />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary sm:text-base">
                {platform.name}
              </span>
              <IconCheckCircle className="h-4 w-4 shrink-0 text-success" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
