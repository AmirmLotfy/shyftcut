import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTierDef, getPersonaCharacter, type PersonaTier } from '@/data/career-dna-personas';
import { getCareerFieldLabel } from '@/data/career-dna-questions';

const TIER_KEYS: Record<string, string> = {
  visionaries: 'careerDna.tier.visionaries',
  naturals: 'careerDna.tier.naturals',
  explorers: 'careerDna.tier.explorers',
  shifters: 'careerDna.tier.shifters',
  awakeners: 'careerDna.tier.awakeners',
  misfits: 'careerDna.tier.misfits',
};

export interface ShareCardData {
  matchScore: number;
  scoreTier?: string;
  personaCharacterId?: string;
  currentField?: string;
}

interface ShareCardProps {
  data: ShareCardData;
  /** Ref forwarded from parent for capture */
  innerRef?: React.RefObject<HTMLDivElement | null>;
}

/** Preloads an image and returns a promise that resolves when loaded */
function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

export function ShareCard({ data, innerRef }: ShareCardProps) {
  const { t, language } = useLanguage();

  const tierId = (data.scoreTier ?? 'naturals') as PersonaTier;
  const tierKey = TIER_KEYS[tierId] ?? 'careerDna.tier.naturals';
  const tierDef = getTierDef(tierId);
  const persona =
    data.personaCharacterId && tierDef
      ? getPersonaCharacter(tierId, data.personaCharacterId)
      : undefined;

  useEffect(() => {
    if (persona?.avatarPath) {
      preloadImage(persona.avatarPath).catch(() => {});
    }
  }, [persona?.avatarPath]);

  const isHighMatch = (data.matchScore ?? 0) >= 90;

  return (
    <div
      ref={innerRef}
      data-share-card
      className="flex aspect-[9/16] w-[337.5px] flex-col items-center justify-between rounded-2xl bg-gradient-to-b from-primary/15 via-primary/8 to-background px-8 py-10 shadow-xl"
      style={{
        width: 337.5,
        height: 600,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div className="flex flex-col items-center">
        {/* Avatar first - prominent & big */}
        {persona && (
          <div className="mb-4 flex justify-center">
            {persona.avatarPath ? (
              <img
                src={persona.avatarPath}
                alt=""
                className="h-28 w-28 shrink-0 rounded-2xl object-cover ring-4 ring-primary/20 shadow-lg"
                crossOrigin="anonymous"
                aria-hidden
              />
            ) : (
              <span className="flex h-28 w-28 items-center justify-center rounded-2xl bg-primary/10 text-5xl" aria-hidden>
                {persona.emoji}
              </span>
            )}
          </div>
        )}

        {/* Score circle */}
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-primary/50 bg-primary/10 text-2xl font-bold">
          {data.matchScore}%
        </div>

        {/* Tier badge */}
        <span
          className={`mt-3 rounded-full px-4 py-1 text-sm font-semibold ${
            isHighMatch ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}
        >
          {t(tierKey)}
        </span>
        <p className="mt-1.5 text-center text-sm font-medium text-muted-foreground">
          {t(`${tierKey}.tagline`)}
        </p>

        {persona && (
          <p className="mt-1 font-semibold">{t(persona.nameKey)}</p>
        )}

        <p className="mt-2 text-center text-sm text-muted-foreground">
          {t('careerDna.result.matchFor')} {data.currentField ? getCareerFieldLabel(data.currentField, language) : t('careerDna.result.yourField')}
        </p>
      </div>

      {/* URL on card for visibility when shared */}
      <p className="pt-4 text-center text-xs font-semibold text-muted-foreground">
        shyftcut.com/career-dna
      </p>
    </div>
  );
}
