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

/** Anghami-style gradient palettes with aurora band + orb colors */
const TIER_GRADIENTS: Record<string, { bg: string; score: string; accent: string; orb: string; orbGlow: string }> = {
  visionaries: {
    bg: 'linear-gradient(180deg, #0a0618 0%, #1a0a2e 25%, #2d1b4e 45%, #6b21a8 60%, #ec4899 75%, #1a0a2e 100%)',
    score: '#f0abfc',
    accent: '#c084fc',
    orb: 'rgba(236,72,153,0.5)',
    orbGlow: 'rgba(236,72,153,0.5)',
  },
  naturals: {
    bg: 'linear-gradient(180deg, #011a14 0%, #022c22 25%, #064e3b 45%, #059669 60%, #06b6d4 75%, #022c22 100%)',
    score: '#5eead4',
    accent: '#2dd4bf',
    orb: 'rgba(6,182,212,0.5)',
    orbGlow: 'rgba(6,182,212,0.5)',
  },
  explorers: {
    bg: 'linear-gradient(180deg, #051018 0%, #0c1929 25%, #1e3a5f 45%, #0284c7 60%, #6366f1 75%, #0c1929 100%)',
    score: '#93c5fd',
    accent: '#60a5fa',
    orb: 'rgba(99,102,241,0.5)',
    orbGlow: 'rgba(99,102,241,0.5)',
  },
  shifters: {
    bg: 'linear-gradient(180deg, #0f0a1e 0%, #1e1b4b 25%, #4c1d95 45%, #a855f7 65%, #f59e0b 85%, #1a0f2e 100%)',
    score: '#fbbf24',
    accent: '#c084fc',
    orb: 'rgba(168,85,247,0.5)',
    orbGlow: 'rgba(245,158,11,0.5)',
  },
  awakeners: {
    bg: 'linear-gradient(180deg, #1a0a06 0%, #451a03 25%, #9a3412 45%, #ea580c 65%, #ef4444 80%, #2a1208 100%)',
    score: '#fdba74',
    accent: '#fb923c',
    orb: 'rgba(234,88,12,0.5)',
    orbGlow: 'rgba(239,68,68,0.5)',
  },
  misfits: {
    bg: 'linear-gradient(180deg, #1a0612 0%, #4c0519 25%, #9f1239 45%, #ec4899 65%, #f43f5e 80%, #2a0a18 100%)',
    score: '#fda4af',
    accent: '#fb7185',
    orb: 'rgba(236,72,153,0.5)',
    orbGlow: 'rgba(244,63,94,0.5)',
  },
};

/** Star scatter positions (percent) for Anghami-style background */
const STAR_POSITIONS = [
  [8, 12], [15, 25], [22, 8], [28, 45], [35, 18], [42, 55], [55, 12], [62, 38], [70, 22], [75, 52],
  [18, 60], [32, 72], [48, 68], [58, 82], [72, 65], [12, 35], [38, 30], [52, 42], [65, 48], [80, 35],
  [5, 80], [25, 88], [45, 78], [68, 90], [88, 75],
];

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

  const gradient = TIER_GRADIENTS[tierId] ?? TIER_GRADIENTS.naturals;
  const fieldLabel = data.currentField ? getCareerFieldLabel(data.currentField, language) : t('careerDna.result.yourField');
  const isRtl = language === 'ar';

  useEffect(() => {
    if (persona?.avatarPath) {
      preloadImage(persona.avatarPath).catch(() => {});
    }
  }, [persona?.avatarPath]);

  return (
    <div
      ref={innerRef}
      data-share-card
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        width: 337.5,
        height: 600,
        background: gradient.bg,
        borderRadius: 24,
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '100px 28px 90px',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* Star scatter – Anghami-style */}
      <svg
        width="100%"
        height="100%"
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        aria-hidden
      >
        {STAR_POSITIONS.map(([x, y], i) => (
          <circle
            key={i}
            cx={`${x}%`}
            cy={`${y}%`}
            r={1}
            fill="rgba(255,255,255,0.6)"
          />
        ))}
      </svg>

      {/* Primary orb – top-right, glass-style with glow */}
      <div
        style={{
          position: 'absolute',
          top: -100,
          right: -80,
          width: 280,
          height: 280,
          borderRadius: '50%',
          background: `radial-gradient(circle at 30% 30%, ${gradient.orb}, transparent 60%)`,
          boxShadow: `0 0 60px ${gradient.orbGlow}`,
          pointerEvents: 'none',
        }}
      />
      {/* Secondary orb – bottom-left */}
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          left: -100,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 35%, ${gradient.orb}, transparent 65%)`,
          boxShadow: `0 0 50px ${gradient.orbGlow}`,
          pointerEvents: 'none',
        }}
      />
      {/* Accent orb – small jewel, bottom-right */}
      <div
        style={{
          position: 'absolute',
          bottom: 120,
          right: 20,
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: `radial-gradient(circle at 30% 30%, ${gradient.accent}, transparent 70%)`,
          boxShadow: `0 0 24px ${gradient.orbGlow}`,
          pointerEvents: 'none',
        }}
      />

      {/* Orbital lines – SVG ellipse framing content */}
      <svg
        width="100%"
        height="100%"
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        aria-hidden
      >
        <ellipse
          cx="50%"
          cy="52%"
          rx="42%"
          ry="32%"
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={1}
        />
        <ellipse
          cx="50%"
          cy="52%"
          rx="36%"
          ry="26%"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />
      </svg>

      {/* Top: "YOUR CAREER DNA" – safe zone */}
      <span
        style={{
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.95)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {t('careerDna.shareCard.yourDna')}
      </span>

      {/* Glass panel – center content */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flex: 1,
          justifyContent: 'center',
          gap: 12,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 24,
          padding: 24,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
      >
        {/* Persona avatar – glass border + inner glow */}
        {persona && (
          <div
            style={{
              width: 160,
              height: 160,
              borderRadius: 28,
              overflow: 'hidden',
              flexShrink: 0,
              boxShadow: '0 16px 48px rgba(0,0,0,0.4), inset 0 0 20px rgba(255,255,255,0.08)',
              border: '4px solid rgba(255,255,255,0.2)',
            }}
          >
            {persona.avatarPath ? (
              <img
                src={persona.avatarPath}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                aria-hidden
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255,255,255,0.1)',
                  fontSize: 64,
                }}
                aria-hidden
              >
                {persona.emoji}
              </div>
            )}
          </div>
        )}

        {/* Score – with glow */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span
              style={{
                fontSize: 88,
                fontWeight: 800,
                color: gradient.score,
                lineHeight: 1,
                textShadow: `0 0 30px ${gradient.orbGlow}`,
              }}
            >
              {data.matchScore}
            </span>
            <span
              style={{
                fontSize: 44,
                fontWeight: 700,
                color: gradient.score,
                textShadow: `0 0 20px ${gradient.orbGlow}`,
              }}
            >
              %
            </span>
          </div>
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.95)',
            }}
          >
            {t('careerDna.shareCard.fit')}
          </span>
        </div>

        {/* Persona name */}
        {persona && (
          <p
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: '#fff',
              margin: 0,
              textAlign: 'center',
              lineHeight: 1.2,
            }}
          >
            {t(persona.nameKey)}
          </p>
        )}

        {/* Persona / tier tagline */}
        <p
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.95)',
            margin: 0,
            textAlign: 'center',
          }}
        >
          {persona ? t(persona.taglineKey) : t(`${tierKey}.tagline`)}
        </p>

        {/* Field */}
        <p
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: gradient.accent,
            margin: 0,
            textAlign: 'center',
          }}
        >
          {t('careerDna.result.matchFor')} {fieldLabel}
        </p>
      </div>

      {/* Bottom: Brand + CTA – safe zone */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <p
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.85)',
            margin: 0,
          }}
        >
          {t('careerDna.shareCard.takeTest')}
        </p>
        <p
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: '#fff',
            margin: 0,
          }}
        >
          shyftcut.com/career-dna
        </p>
      </div>
    </div>
  );
}
