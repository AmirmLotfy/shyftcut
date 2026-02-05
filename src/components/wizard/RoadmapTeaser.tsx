import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Map, LogIn, UserPlus, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

export interface TeaserWeek {
  title: string;
  description: string;
  skills_to_learn: string[];
  deliverables: string[];
  courses?: { title: string; platform: string }[];
}

export interface RoadmapTeaserData {
  title: string;
  description: string | null;
  weeks: TeaserWeek[];
}

interface RoadmapTeaserProps {
  data: RoadmapTeaserData;
}

export function RoadmapTeaser({ data }: RoadmapTeaserProps) {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto max-w-2xl px-4 py-12"
    >
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Map className="h-7 w-7 text-primary" />
        </div>
        <h1 className="mb-2 text-2xl font-bold sm:text-3xl">
          {t('wizard.teaser.heading')}
        </h1>
        <p className="text-muted-foreground">
          {t('wizard.teaser.subtitle')}
        </p>
        <ul className="mt-4 list-inside list-disc text-left text-sm text-muted-foreground">
          <li>{t('wizard.teaser.bulletFull')}</li>
          <li>{t('wizard.teaser.bulletCourses')}</li>
          <li>{t('wizard.teaser.bulletQuizzes')}</li>
          <li>{t('wizard.teaser.bulletCoach')}</li>
          <li>{t('wizard.teaser.bulletProgress')}</li>
        </ul>
      </div>

      <Card className="public-glass-card mb-8 shadow-lg">
        <CardContent className="p-6">
          <h2 className="mb-1 text-lg font-semibold">{data.title}</h2>
          {data.description && (
            <p className="mb-6 text-sm text-muted-foreground line-clamp-2">{data.description}</p>
          )}
          <div className="space-y-6">
            {data.weeks.map((week, idx) => (
              <div key={idx} className="rounded-lg border border-border/50 bg-muted/30 p-4">
                <h3 className="mb-2 font-medium text-primary">
                  {t('wizard.teaser.week')} {idx + 1}: {week.title}
                </h3>
                {week.description && (
                  <p className="mb-3 text-sm text-muted-foreground">{week.description}</p>
                )}
                {week.skills_to_learn?.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {week.skills_to_learn.map((s, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                {week.deliverables?.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {t('wizard.teaser.deliverables')}: {week.deliverables.join(', ')}
                  </p>
                )}
                {week.courses?.length > 0 && week.courses[0]?.title && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t('wizard.teaser.suggestedCourse')}: {week.courses[0].title}
                    {week.courses[0].platform ? ` (${week.courses[0].platform})` : ''}
                  </p>
                )}
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t('wizard.teaser.moreWeeks')}
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Button asChild size="lg" className="gap-2 w-full sm:w-auto">
          <Link to="/signup?from=guest">
            <UserPlus className="h-4 w-4" />
            {t('wizard.teaser.signUp')}
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="gap-2 w-full sm:w-auto">
          <Link to="/login?from=guest">
            <LogIn className="h-4 w-4" />
            {t('wizard.teaser.logIn')}
          </Link>
        </Button>
      </div>
      <Link
        to="/"
        className="mt-4 text-sm text-muted-foreground underline-offset-4 hover:text-foreground transition-colors"
      >
        {t('wizard.teaser.backHome')}
      </Link>
    </motion.div>
  );
}
