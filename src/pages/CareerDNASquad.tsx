import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/layout/Layout';
import { PublicPageMeta } from '@/components/seo/PublicPageMeta';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiPath, apiHeaders } from '@/lib/api';
import { getSeo } from '@/data/seo-content';

interface SquadResult {
  resultId: string;
  matchScore: number;
  personalityArchetype?: string;
  archetypeDescription?: string;
  superpower?: string;
  suggestedCareers: { career?: string; matchPercent?: number }[];
  scoreTier?: string;
  personaCharacterId?: string;
  currentField?: string;
}

interface SquadData {
  slug: string;
  results: SquadResult[];
}

const TIER_KEYS: Record<string, string> = {
  visionaries: 'careerDna.tier.visionaries',
  naturals: 'careerDna.tier.naturals',
  explorers: 'careerDna.tier.explorers',
  shifters: 'careerDna.tier.shifters',
  awakeners: 'careerDna.tier.awakeners',
  misfits: 'careerDna.tier.misfits',
};

export default function CareerDNASquad() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<SquadData | null>(null);
  const [loading, setLoading] = useState(true);
  const { t, language } = useLanguage();

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiPath(`/api/career-dna/squad/${slug}`), {
          headers: apiHeaders(`/api/career-dna/squad/${slug}`, null),
        });
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setData(null);
          return;
        }
        setData({ slug: json.slug, results: json.results ?? [] });
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const seo = getSeo('/career-dna', language);

  if (loading) {
    return (
      <Layout>
        <PublicPageMeta title={seo.title} description={seo.description} path="/career-dna" />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <PublicPageMeta title={seo.title} description={seo.description} path="/career-dna" />
        <div className="container mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="text-xl font-bold">{t('common.error')}</h1>
          <p className="mt-2 text-muted-foreground">Squad not found.</p>
          <Button asChild className="mt-6">
            <Link to="/career-dna">{t('careerDna.backHome')}</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PublicPageMeta
        title={`${t('careerDna.squad.title')} | Shyftcut`}
        description={t('careerDna.squad.compare')}
        path={`/career-dna/squad/${slug}`}
      />
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background via-background to-primary/5">
        <div className="container mx-auto max-w-2xl px-4 py-8 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">{t('careerDna.squad.title')}</span>
            </div>
            <h1 className="text-2xl font-bold sm:text-3xl">{t('careerDna.squad.compare')}</h1>
            <p className="mt-2 text-muted-foreground">{t('careerDna.squad.challengeFriends')}</p>
          </motion.div>

          {data.results.length === 0 ? (
            <Card className="text-center">
              <CardContent className="py-12">
                <p className="text-muted-foreground">{t('careerDna.squad.takeQuiz')}</p>
                <Button asChild className="mt-4">
                  <Link to={`/career-dna?squad=${slug}`}>{t('careerDna.squad.takeQuiz')}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {data.results.map((r, i) => (
                <motion.div
                  key={r.resultId}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold">{r.matchScore}%</span>
                            <Badge variant="secondary">
                              {t(TIER_KEYS[r.scoreTier ?? ''] ?? 'careerDna.tier.naturals')}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {r.currentField ?? ''}
                          </p>
                          {r.personalityArchetype && (
                            <p className="mt-2 font-medium">{r.personalityArchetype}</p>
                          )}
                          {r.superpower && (
                            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                              <Sparkles className="h-3 w-3" />
                              {r.superpower}
                            </p>
                          )}
                          {r.suggestedCareers?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {r.suggestedCareers.slice(0, 3).map((sc, j) => (
                                <Badge key={j} variant="outline" className="text-xs">
                                  {sc.career}
                                  {typeof sc.matchPercent === 'number' && ` ${sc.matchPercent}%`}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button asChild size="sm" className="shrink-0 gap-2">
                          <Link to={`/career-dna/result/${r.resultId}`}>
                            {t('common.view')}
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          <div className="mt-10 text-center">
            <Button asChild variant="outline">
              <Link to={`/career-dna?squad=${slug}`}>{t('careerDna.squad.takeQuiz')}</Link>
            </Button>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            <Link to="/" className="underline hover:text-foreground">
              {t('careerDna.backHome')}
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}
