import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Loader2, Sparkles, ArrowRight, Share2, Link2, Trophy, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Layout } from '@/components/layout/Layout';
import { PublicPageMeta } from '@/components/seo/PublicPageMeta';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { getCareerFieldLabel } from '@/data/career-dna-questions';
import { apiPath, apiHeaders } from '@/lib/api';
import { getSeo } from '@/data/seo-content';
import { useToast } from '@/hooks/use-toast';
import { BASE_URL } from '@/lib/seo';

interface SquadResult {
  resultId: string;
  matchScore: number;
  displayName?: string | null;
  personalityArchetype?: string;
  superpower?: string;
  suggestedCareers: { career?: string; matchPercent?: number }[];
  scoreTier?: string;
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

function getShareUrl(slug: string) {
  return `${BASE_URL}/career-dna/squad/${slug}`;
}

function getWhatsAppShareUrl(slug: string, text: string) {
  const url = getShareUrl(slug);
  return `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
}

function getTwitterShareUrl(slug: string, text: string) {
  const url = getShareUrl(slug);
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
}

export default function CareerDNASquad() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<SquadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('');
  const [phoneConsent, setPhoneConsent] = useState(false);
  const [submittingPhone, setSubmittingPhone] = useState(false);
  const [phoneSubmitted, setPhoneSubmitted] = useState(false);
  const [showPhoneForm, setShowPhoneForm] = useState(false);
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();

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

  const squadUrl = slug ? getShareUrl(slug) : '';

  const handleCopyLink = async () => {
    if (!squadUrl) return;
    try {
      await navigator.clipboard.writeText(squadUrl);
      toast({ title: t('careerDna.squad.linkCopied'), duration: 2000 });
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' });
    }
  };

  const handleShareNative = async () => {
    if (!slug || !squadUrl) return;
    const text = language === 'ar'
      ? 'تحدّاني! قارن نتائجنا في اختبار الحمض النووي المهني'
      : 'Challenge accepted! Compare our Career DNA results';
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Career DNA Squad',
          text,
          url: squadUrl,
        });
        toast({ title: t('careerDna.result.shared'), duration: 2000 });
      } else {
        handleCopyLink();
      }
    } catch {
      handleCopyLink();
    }
  };

  const handleSubmitPhone = async () => {
    if (!slug || !phone.trim() || !phoneConsent) return;
    setSubmittingPhone(true);
    try {
      const res = await fetch(apiPath('/api/career-dna/lead'), {
        method: 'POST',
        headers: apiHeaders('/api/career-dna/lead', null),
        body: JSON.stringify({
          phone: phone.trim(),
          source: 'squad',
          sourceId: slug,
          consentMarketing: phoneConsent,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as { error?: string }).error);
      setPhoneSubmitted(true);
      setPhone('');
      toast({ title: t('careerDna.squad.phoneSuccess'), duration: 3000 });
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' });
    } finally {
      setSubmittingPhone(false);
    }
  };

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
          <p className="mt-2 text-muted-foreground">{t('careerDna.squad.notFound')}</p>
          <Button asChild className="mt-6">
            <Link to="/career-dna">{t('careerDna.backHome')}</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const shareText = language === 'ar'
    ? 'تحدّاني! قارن نتائجنا في اختبار الحمض النووي المهني'
    : 'Challenge accepted! Compare our Career DNA results';

  return (
    <Layout>
      <PublicPageMeta
        title={`${t('careerDna.squad.title')} | Shyftcut`}
        description={t('careerDna.squad.compare')}
        path={`/career-dna/squad/${slug}`}
      />
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background via-background to-primary/5">
        <div className="container mx-auto max-w-2xl px-4 py-5 sm:py-8 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 text-center sm:mb-8"
          >
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 sm:mb-4">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">{t('careerDna.squad.leaderboard')}</span>
            </div>
            <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">{t('careerDna.squad.compare')}</h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">{t('careerDna.squad.challengeFriends')}</p>
          </motion.div>

          {/* Share & Copy - prominent */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-6 flex flex-wrap items-center justify-center gap-2"
          >
            <Button onClick={handleCopyLink} variant="default" size="sm" className="gap-2">
              <Link2 className="h-4 w-4" />
              {t('careerDna.squad.copyLink')}
            </Button>
            <Button onClick={handleShareNative} variant="outline" size="sm" className="gap-2">
              <Share2 className="h-4 w-4" />
              {t('careerDna.result.share')}
            </Button>
            {typeof window !== 'undefined' && !/Android|webOS|iPhone|iPad/i.test(navigator.userAgent) && (
              <>
                <a
                  href={getWhatsAppShareUrl(slug!, shareText)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex"
                >
                  <Button variant="outline" size="sm" type="button" className="gap-2">
                    WhatsApp
                  </Button>
                </a>
                <a
                  href={getTwitterShareUrl(slug!, shareText)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex"
                >
                  <Button variant="outline" size="sm" type="button" className="gap-2">
                    X
                  </Button>
                </a>
              </>
            )}
          </motion.div>

          {data.results.length === 0 ? (
            <Card className="text-center">
              <CardContent className="py-12">
                <p className="text-muted-foreground">{t('careerDna.squad.takeQuiz')}</p>
                <Button asChild className="mt-4" size="lg">
                  <Link to={`/career-dna?squad=${slug}`}>{t('careerDna.squad.takeQuiz')}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Podium for top 3 */}
              {data.results.length >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mb-6 flex items-end justify-center gap-1 sm:gap-2"
                >
                  {[
                    data.results[1],
                    data.results[0],
                    data.results[2],
                  ].filter(Boolean).map((r, idx) => {
                    const rank = [2, 1, 3][idx];
                    const heights = ['h-20', 'h-24', 'h-16'];
                    return (
                      <div key={(r as SquadResult).resultId} className="flex flex-1 max-w-24 flex-col items-center">
                        <span className="mb-1 text-2xl font-bold text-muted-foreground">#{rank}</span>
                        <div
                          className={`flex w-full flex-col items-center justify-end rounded-t-lg bg-primary/15 px-2 py-3 ${heights[idx]}`}
                        >
                          <span className="text-lg font-bold">{(r as SquadResult).matchScore}%</span>
                          <span className="mt-1 truncate text-center text-xs font-medium">
                            {(r as SquadResult).displayName ||
                              getCareerFieldLabel((r as SquadResult).currentField, language) ||
                              '—'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}

              {/* Full leaderboard list */}
              <div className="space-y-3">
                {data.results.map((r, i) => (
                  <motion.div
                    key={r.resultId}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.03 }}
                  >
                    <Card className={i < 3 ? 'ring-2 ring-primary/20' : ''}>
                      <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between sm:pt-6">
                        <div className="flex items-start gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold">
                            #{i + 1}
                          </span>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xl font-bold">{r.matchScore}%</span>
                              <Badge variant="secondary">
                                {t(TIER_KEYS[r.scoreTier ?? ''] ?? 'careerDna.tier.naturals')}
                              </Badge>
                            </div>
                            <p className="mt-0.5 font-medium">
                              {r.displayName || getCareerFieldLabel(r.currentField, language) || t('careerDna.result.yourField')}
                            </p>
                            {r.superpower && (
                              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                                <Sparkles className="h-3 w-3 shrink-0" />
                                {r.superpower}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button asChild size="sm" className="w-full shrink-0 gap-2 sm:w-auto">
                          <Link to={`/career-dna/result/${r.resultId}`}>
                            {t('common.view')}
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Take quiz CTA */}
              <div className="mt-6 text-center sm:mt-8">
                <Button asChild size="lg" className="w-full max-w-xs sm:w-auto">
                  <Link to={`/career-dna?squad=${slug}`}>{t('careerDna.squad.takeQuiz')}</Link>
                </Button>
              </div>

              {/* Phone collection (collapsible) */}
              {!phoneSubmitted && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6"
                >
                  {!showPhoneForm ? (
                    <button
                      type="button"
                      onClick={() => setShowPhoneForm(true)}
                      className="flex w-full items-center justify-between rounded-lg border border-dashed border-muted-foreground/30 px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                    >
                      <span>{t('careerDna.squad.phonePrompt')}</span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  ) : (
                    <Card>
                      <CardContent className="pt-5">
                        <Label className="text-sm">{t('careerDna.squad.phonePrompt')}</Label>
                        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                          <Input
                            type="tel"
                            placeholder={t('careerDna.squad.phonePlaceholder')}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            onClick={handleSubmitPhone}
                            disabled={!phone.trim() || !phoneConsent || submittingPhone}
                            size="default"
                          >
                            {submittingPhone ? <Loader2 className="h-4 w-4 animate-spin" /> : t('careerDna.squad.phoneSubmit')}
                          </Button>
                        </div>
                        <label className="mt-2 flex cursor-pointer items-start gap-2">
                          <input
                            type="checkbox"
                            checked={phoneConsent}
                            onChange={(e) => setPhoneConsent(e.target.checked)}
                            className="mt-1"
                          />
                          <span className="text-xs text-muted-foreground">{t('careerDna.squad.phoneConsent')}</span>
                        </label>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              )}
            </>
          )}

          {/* Signup CTA - for non-logged-in users */}
          {!user && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8"
            >
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="py-6 text-center">
                  <p className="font-medium">{t('careerDna.signup.saveResult')}</p>
                  <Button asChild className="mt-3" size="lg">
                    <Link to={`/signup?redirect=/career-dna/squad/${slug}`}>{t('careerDna.signup.cta')}</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

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
