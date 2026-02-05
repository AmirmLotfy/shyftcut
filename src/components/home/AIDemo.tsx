import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { IconSparkle, IconArrowRight } from '@/lib/icons';

const sampleGoals = [
  { en: 'Become a Data Analyst', ar: 'أصبح محلل بيانات' },
  { en: 'Switch to Product Management', ar: 'الانتقال إلى إدارة المنتجات' },
  { en: 'Learn Frontend Development', ar: 'تعلم تطوير الواجهات' },
];

export function AIDemo() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [goal, setGoal] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [preview, setPreview] = useState(false);

  const handleTry = () => {
    setSimulating(true);
    setTimeout(() => {
      setSimulating(false);
      setPreview(true);
    }, 2000);
  };

  return (
    <section className="bg-muted/20 py-12 sm:py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid gap-8 md:grid-cols-2 md:items-center md:gap-16"
        >
          {/* Copy — start side (left LTR, right RTL) */}
          <div className="text-start">
            <h2 className="mb-3 text-2xl font-bold sm:text-3xl md:text-4xl">
              {language === 'ar' ? 'جرب الذكاء الاصطناعي' : 'Try the AI Preview'}
            </h2>
            <p className="max-w-lg text-sm text-muted-foreground sm:text-base">
              {language === 'ar'
                ? 'اكتب هدفك المهني وشاهد كيف يبني الذكاء الاصطناعي خريطة طريقك.'
                : 'Type your career goal and see how AI builds your roadmap.'}
            </p>
          </div>

          {/* Input + goals + button — end side */}
          <div className="space-y-4 text-start">
            <Input
              type="text"
              placeholder={language === 'ar' ? 'مثال: أصبح مطور برمجيات' : 'e.g. Become a Software Developer'}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="min-h-[48px] h-12 rounded-xl"
            />
            <div className="flex flex-wrap gap-2">
              {sampleGoals.map((g) => (
                <button
                  key={g.en}
                  type="button"
                  onClick={() => setGoal(g[language])}
                  className="rounded-full border border-border bg-background px-4 py-2 text-sm transition-colors hover:border-primary/50 hover:bg-primary/5"
                >
                  {g[language]}
                </button>
              ))}
            </div>
            <Button
              size="lg"
              className="btn-glow gap-2"
              onClick={handleTry}
              disabled={simulating || !goal.trim()}
            >
              {simulating ? (
                <>
                  <IconSparkle className="h-5 w-5 animate-pulse" />
                  {language === 'ar' ? 'جاري الإنشاء...' : 'Building...'}
                </>
              ) : preview ? (
                language === 'ar' ? 'تم!' : 'Done!'
              ) : (
                <>
                  {language === 'ar' ? 'معاينة' : 'Preview'}
                  <IconArrowRight className="h-5 w-5 rtl:rotate-180" />
                </>
              )}
            </Button>
            {preview && (
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'سجّل للحصول على خريطة طريقك الكاملة.' : 'Sign up to get your full roadmap.'}{' '}
                <Link to={user ? '/wizard' : '/signup'} className="font-medium text-primary hover:underline">
                  {user ? (language === 'ar' ? 'ابدأ المعالج' : 'Start wizard') : language === 'ar' ? 'إنشاء حساب' : 'Create account'}
                </Link>
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
