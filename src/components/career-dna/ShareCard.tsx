import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTierDef, getPersonaCharacter, type PersonaTier } from '@/data/career-dna-personas';

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
  const { t } = useLanguage();

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
      className="flex aspect-[9/16] w-[337.5px] flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-primary/10 via-primary/5 to-background px-8 py-12"
      style={{
        width: 337.5,
        height: 600,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Score circle */}
      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-primary/40 bg-primary/5 text-3xl font-bold">
        {data.matchScore}%
      </div>

      {/* Tier badge */}
      <span
        className={`mt-4 rounded-full px-4 py-1 text-sm font-semibold ${
          isHighMatch ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}
      >
        {t(tierKey)}
      </span>
      <p className="mt-2 text-center text-sm font-medium text-muted-foreground">
        {t(`${tierKey}.tagline`)}
      </p>

      {/* Persona - always show avatar when available */}
      {persona && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {persona.avatarPath ? (
            <img
              src={persona.avatarPath}
              alt=""
              className="h-14 w-14 shrink-0 rounded-full object-cover"
              crossOrigin="anonymous"
              aria-hidden
            />
          ) : (
            <span className="text-2xl" aria-hidden>
              {persona.emoji}
            </span>
          )}
          <span className="font-semibold">{t(persona.nameKey)}</span>
        </div>
      )}

      <p className="mt-2 text-center text-sm text-muted-foreground">
        {t('careerDna.result.match')} for {data.currentField ?? t('careerDna.result.yourField')}
      </p>

      {/* URL on card for visibility when shared */}
      <p className="mt-auto pt-8 text-center text-xs font-medium text-muted-foreground">
        shyftcut.com/career-dna
      </p>
    </div>
  );
}
