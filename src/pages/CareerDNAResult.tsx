import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Share2,
  Copy,
  Users,
  ArrowRight,
  Loader2,
  Dna,
  Zap,
  Target,
  Link2,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/layout/Layout';
import { PublicPageMeta } from '@/components/seo/PublicPageMeta';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiPath, apiHeaders, extractApiErrorMessage } from '@/lib/api';
import { CheckoutButton } from '@/components/pricing/CheckoutButton';
import { POLAR_PRODUCTS } from '@/lib/polar-config';
import { dashboardPaths } from '@/lib/dashboard-routes';
import { BASE_URL } from '@/lib/seo';
import { captureShareCard } from '@/lib/share-card';
import { ShareCard } from '@/components/career-dna/ShareCard';
import { getTierDef, getPersonaCharacter, type PersonaTier } from '@/data/career-dna-personas';
import { getCareerFieldLabel } from '@/data/career-dna-questions';

interface SuggestedCareer {
  career?: string;
  matchPercent?: number;
  reason?: string;
}

interface ResultData {
  resultId: string;
  matchScore: number;
  personalityArchetype?: string;
  archetypeDescription?: string;
  superpower?: string;
  superpowerRarity?: string;
  hiddenTalent?: string;
  hiddenTalentCareerHint?: string;
  suggestedCareers: SuggestedCareer[];
  shareableQuote?: string;
  scoreTier?: string;
  personaCharacterId?: string;
  currentField?: string;
  isStudent?: boolean;
}

const TIER_KEYS: Record<string, string> = {
  visionaries: 'careerDna.tier.visionaries',
  naturals: 'careerDna.tier.naturals',
  explorers: 'careerDna.tier.explorers',
  shifters: 'careerDna.tier.shifters',
  awakeners: 'careerDna.tier.awakeners',
  misfits: 'careerDna.tier.misfits',
};

export default function CareerDNAResult() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingSquad, setCreatingSquad] = useState(false);
  const [squadUrl, setSquadUrl] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveModalImageUrl, setSaveModalImageUrl] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const shareCardRef = useRef<HTMLDivElement | null>(null);
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiPath(`/api/career-dna/result/${id}`), {
          headers: apiHeaders(`/api/career-dna/result/${id}`, null),
        });
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setData(null);
          return;
        }
        setData({
          resultId: json.resultId,
          matchScore: json.matchScore ?? 0,
          personalityArchetype: json.personalityArchetype,
          archetypeDescription: json.archetypeDescription,
          superpower: json.superpower,
          superpowerRarity: json.superpowerRarity,
          hiddenTalent: json.hiddenTalent,
          hiddenTalentCareerHint: json.hiddenTalentCareerHint,
          suggestedCareers: Array.isArray(json.suggestedCareers) ? json.suggestedCareers : [],
          shareableQuote: json.shareableQuote,
          scoreTier: json.scoreTier,
          personaCharacterId: json.personaCharacterId,
          currentField: json.currentField,
          isStudent: json.isStudent,
        });
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const shareUrl = id ? `${BASE_URL}/career-dna/result/${id}` : '';
  const shareText = data?.shareableQuote || (data
    ? language === 'ar'
      ? `نسبة توافقي ${data.matchScore}٪ في ${data.isStudent ? 'تخصصي' : 'مجالي'}. ما نسبتك؟ اختبر الحمض النووي المهني: ${shareUrl}`
      : `I'm a ${data.matchScore}% match for my ${data.isStudent ? 'major' : 'field'}. What's yours? Take the Career DNA test: ${shareUrl}`
    : '');

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: t('careerDna.result.linkCopied'), duration: 2000 });
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' });
    }
  };

  const handleShare = async () => {
    const el = shareCardRef.current;
    if (!el || !data) return;
    setIsCapturing(true);
    try {
      const blob = await captureShareCard(el);
      const file = new File(
        [blob],
        `career-dna-${data.matchScore}-match.png`,
        { type: 'image/png' }
      );
      const shareData = { files: [file], title: 'Career DNA', text: shareText };
      if (typeof navigator.canShare === 'function' && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast({ title: t('careerDna.result.shared'), duration: 2000 });
      } else if (navigator.share) {
        try {
          await navigator.share({ title: 'Career DNA', text: shareText, url: shareUrl });
          toast({ title: t('careerDna.result.shared'), duration: 2000 });
        } catch (e) {
          if ((e as Error).name !== 'AbortError') handleCopyLink();
        }
      } else {
        await handleCopyLink();
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        handleCopyLink();
      }
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSave = async () => {
    const el = shareCardRef.current;
    if (!el || !data) return;
    setIsCapturing(true);
    try {
      const blob = await captureShareCard(el);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `career-dna-${data.matchScore}-match.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: t('careerDna.result.saved'), duration: 2000 });
      setSaveModalImageUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
      setShowSaveModal(true);
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' });
    } finally {
      setIsCapturing(false);
    }
  };

  const handleChallengeFriends = async () => {
    if (!data?.resultId) return;
    setCreatingSquad(true);
    try {
      const res = await fetch(apiPath('/api/career-dna/squad/create'), {
        method: 'POST',
        headers: apiHeaders('/api/career-dna/squad/create', null),
        body: JSON.stringify({ resultId: data.resultId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(extractApiErrorMessage(json, 'Failed'));
      const url = json.url;
      if (url) {
        setSquadUrl(url);
        await navigator.clipboard.writeText(url);
        toast({ title: t('careerDna.result.linkCopied'), description: url, duration: 3000 });
        navigate(`/career-dna/squad/${json.slug}`);
      }
    } catch (err) {
      toast({
        title: t('common.errorTitle'),
        description: err instanceof Error ? err.message : t('common.error'),
        variant: 'destructive',
      });
    } finally {
      setCreatingSquad(false);
    }
  };

  const wizardUrl = data?.suggestedCareers?.[0]?.career
    ? `/wizard?from=careerdna&targetCareer=${encodeURIComponent(data.suggestedCareers[0].career)}`
    : '/wizard?from=careerdna';
  const upgradeUrl = '/upgrade?from=careerdna';

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="container mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="text-xl font-bold">{t('common.error')}</h1>
          <p className="mt-2 text-muted-foreground">Result not found or expired.</p>
          <Button asChild className="mt-6">
            <Link to="/career-dna">{t('careerDna.backHome')}</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const tierId = (data.scoreTier ?? 'naturals') as PersonaTier;
  const tierKey = TIER_KEYS[tierId] ?? 'careerDna.tier.naturals';
  const tierDef = getTierDef(tierId);
  const persona = data.personaCharacterId && tierDef
    ? getPersonaCharacter(tierId, data.personaCharacterId)
    : undefined;
  const isHighMatch = (data.matchScore ?? 0) >= 90;
  const isLowMatch = (data.matchScore ?? 0) < 75;
  const premiumProduct = POLAR_PRODUCTS.premium.yearly;

  return (
    <Layout>
      {/* Hidden share card for image capture - off-screen but rendered for html-to-image */}
      <div
        className="pointer-events-none fixed left-[-9999px] top-0 z-[-1]"
        aria-hidden
      >
        <ShareCard
          data={{
            matchScore: data.matchScore,
            scoreTier: data.scoreTier,
            personaCharacterId: data.personaCharacterId,
            currentField: data.currentField,
          }}
          innerRef={shareCardRef}
        />
      </div>

      <PublicPageMeta
        title={`Career DNA: ${data.matchScore}% match | ${data.currentField ?? 'Result'} | Shyftcut`}
        description={data.shareableQuote ?? `I'm a ${data.matchScore}% match for my field. Take the Career DNA test.`}
        path={`/career-dna/result/${id}`}
      />
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background via-background to-primary/5">
        <div className="container mx-auto max-w-2xl px-4 py-5 sm:py-8 sm:px-6">
          {/* Results card: score + tier + persona */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-5 flex flex-col items-center rounded-2xl border border-primary/10 bg-card/50 px-4 py-6 shadow-sm sm:mb-6 sm:px-6 sm:py-8"
          >
            {/* Avatar – prominent & large */}
            {persona && (
              <div className="mb-4 flex justify-center">
                {persona.avatarPath ? (
                  <img
                    src={persona.avatarPath}
                    alt=""
                    className="h-28 w-28 shrink-0 rounded-2xl object-cover ring-4 ring-primary/20 shadow-md sm:h-32 sm:w-32"
                    loading="eager"
                    aria-hidden
                  />
                ) : (
                  <span className="flex h-28 w-28 items-center justify-center rounded-2xl bg-primary/10 text-5xl sm:h-32 sm:w-32 sm:text-6xl" aria-hidden>
                    {persona.emoji}
                  </span>
                )}
              </div>
            )}
            <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-primary/40 bg-primary/5 text-3xl font-bold sm:h-32 sm:w-32 sm:text-4xl">
              {data.matchScore}%
            </div>
            <Badge className="mt-4" variant={isHighMatch ? 'default' : 'secondary'}>
              {t(tierKey)}
            </Badge>
            <p className="mt-2 text-center text-sm font-medium text-muted-foreground">
              {t(`${tierKey}.tagline`)}
            </p>
            {persona && (
              <p className="mt-1 flex items-center justify-center gap-2 text-center">
                <span className="font-semibold">{t(persona.nameKey)}</span>
              </p>
            )}
            <p className="mt-2 text-center text-muted-foreground">
              {t('careerDna.result.matchFor')} {data.currentField ? getCareerFieldLabel(data.currentField, language) : t('careerDna.result.yourField')}
            </p>

            {/* Share & Save – directly under results card */}
            <div className="mt-6 w-full space-y-3">
              {/* Desktop: horizontal row */}
              <div className="hidden sm:flex sm:flex-wrap sm:justify-center sm:gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  disabled={isCapturing}
                  className="gap-2"
                >
                  {isCapturing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}
                  {t('careerDna.result.share')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={isCapturing}
                  className="gap-2"
                >
                  {isCapturing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {t('careerDna.result.saveImage')}
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-2">
                  <Link2 className="h-4 w-4" />
                  {t('careerDna.result.copyLink')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleChallengeFriends}
                  disabled={creatingSquad}
                  className="gap-2"
                >
                  {creatingSquad ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Users className="h-4 w-4" />
                  )}
                  {t('careerDna.result.challengeFriends')}
                </Button>
              </div>
              {/* Mobile: 2x2 grid, larger touch targets */}
              <div className="grid grid-cols-2 gap-2 sm:hidden">
                <Button
                  variant="outline"
                  size="default"
                  onClick={handleShare}
                  disabled={isCapturing}
                  className="h-12 gap-2"
                >
                  {isCapturing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}
                  {t('careerDna.result.share')}
                </Button>
                <Button
                  variant="outline"
                  size="default"
                  onClick={handleSave}
                  disabled={isCapturing}
                  className="h-12 gap-2"
                >
                  {isCapturing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {t('careerDna.result.saveImage')}
                </Button>
                <Button variant="outline" size="default" onClick={handleCopyLink} className="h-12 gap-2">
                  <Link2 className="h-4 w-4" />
                  {t('careerDna.result.copyLink')}
                </Button>
                <Button
                  variant="outline"
                  size="default"
                  onClick={handleChallengeFriends}
                  disabled={creatingSquad}
                  className="h-12 gap-2"
                >
                  {creatingSquad ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Users className="h-4 w-4" />
                  )}
                  {t('careerDna.result.challengeFriends')}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Archetype */}
          {data.personalityArchetype && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="mb-4 sm:mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Dna className="h-4 w-4 text-primary" />
                    {t('careerDna.result.archetype')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-semibold">{data.personalityArchetype}</p>
                  {data.archetypeDescription && (
                    <p className="text-sm text-muted-foreground">{data.archetypeDescription}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Superpower */}
          {data.superpower && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="mb-4 sm:mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="h-4 w-4 text-primary" />
                    {t('careerDna.result.superpower')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p>{data.superpower}</p>
                  {data.superpowerRarity && (
                    <p className="text-xs text-muted-foreground">{data.superpowerRarity}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Hidden talent */}
          {data.hiddenTalent && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="mb-4 sm:mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="h-4 w-4 text-primary" />
                    {t('careerDna.result.hiddenTalent')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{data.hiddenTalent}</p>
                  {data.hiddenTalentCareerHint && (
                    <p className="mt-1 text-sm text-muted-foreground">{data.hiddenTalentCareerHint}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Suggested careers */}
          {data.suggestedCareers && data.suggestedCareers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <h2 className="mb-4 text-lg font-semibold">
                {isLowMatch ? t('careerDna.result.dnaSays') : t('careerDna.result.suggestedCareers')}
              </h2>
              <div className="space-y-3">
                {data.suggestedCareers.map((sc, i) => (
                  <Card key={i}>
                    <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between sm:pt-6">
                      <div>
                        <p className="font-medium">{getCareerFieldLabel(sc.career, language) || sc.career}</p>
                        {sc.reason && (
                          <p className="text-sm text-muted-foreground">{sc.reason}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {typeof sc.matchPercent === 'number' && (
                          <Badge variant="outline">{sc.matchPercent}%</Badge>
                        )}
                        <Button asChild size="sm" className="w-full sm:w-auto">
                          <Link to={`/wizard?from=careerdna&targetCareer=${encodeURIComponent(sc.career ?? '')}`}>
                            {t('careerDna.result.getRoadmap')}
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {/* Signup CTA for non-logged-in users */}
          {!user && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="mb-6 border-primary/20 bg-primary/5">
                <CardContent className="py-6 text-center">
                  <p className="font-medium">{t('careerDna.signup.saveResult')}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t('careerDna.signup.unlockRoadmap')}</p>
                  <Button asChild className="mt-3" size="lg">
                    <Link to={`/signup?redirect=/career-dna/result/${id}`}>{t('careerDna.signup.cta')}</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 space-y-4"
          >
            {isHighMatch && (
              <p className="text-center text-sm font-medium text-primary">
                {t('careerDna.result.unicornMatch')}
              </p>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:flex-wrap">
              <Button asChild size="lg" className="gap-2">
                <Link to={wizardUrl}>
                  {t('careerDna.result.fullRoadmap')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <CheckoutButton
                planId="premium"
                productId={premiumProduct.productId}
                variant="outline"
                size="lg"
                returnTo={dashboardPaths.index}
                metadata={{ from: 'careerdna', career_dna_result_id: data.resultId }}
              >
                {t('careerDna.result.quizTakersDiscount')}
              </CheckoutButton>
            </div>
          </motion.div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            <Link to="/" className="underline hover:text-foreground">
              {t('careerDna.backHome')}
            </Link>
          </p>
        </div>
      </div>

      <Dialog
        open={showSaveModal}
        onOpenChange={(open) => {
          if (!open && saveModalImageUrl) {
            URL.revokeObjectURL(saveModalImageUrl);
            setSaveModalImageUrl(null);
          }
          setShowSaveModal(open);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('careerDna.result.saved')}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            {saveModalImageUrl && (
              <img
                src={saveModalImageUrl}
                alt="Career DNA result"
                className="max-h-[60vh] w-auto rounded-lg object-contain"
              />
            )}
            <p className="text-center text-sm text-muted-foreground">
              {t('careerDna.result.longPressHint')}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
