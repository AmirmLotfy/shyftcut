import { motion } from 'framer-motion';
import { testimonials } from '@/data/testimonials';
import { useLanguage } from '@/contexts/LanguageContext';

/** Simple editorial layout: two featured quotes (no marquee). */
export function TestimonialMarquee() {
  const { language } = useLanguage();
  const featured = testimonials.slice(0, 2);

  return (
    <section className="border-t border-border py-16 md:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 text-start"
        >
          <h2 className="font-heading mb-2 text-2xl font-bold md:text-3xl">
            {language === 'ar' ? 'ماذا يقول المتعلمون' : 'What learners say'}
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            {language === 'ar'
              ? 'تجارب حقيقية من مستخدمي Shyftcut.'
              : 'Real experiences from Shyftcut users.'}
          </p>
        </motion.div>
        <div className="grid gap-6 sm:grid-cols-2 md:gap-8">
          {featured.map((t, i) => (
            <motion.blockquote
              key={t.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="public-glass-card rounded-xl p-6"
            >
              <p className="text-sm leading-relaxed text-foreground sm:text-base">&ldquo;{t.quote[language]}&rdquo;</p>
              <footer className="mt-4 flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  {t.author.charAt(0)}
                </div>
                <div>
                  <cite className="not-italic font-medium">{t.author}</cite>
                  <p className="text-xs text-muted-foreground">{t.role[language]}</p>
                </div>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
