/**
 * Career DNA viral-optimized personas.
 * 6 tiers × 4 characters = 24 personas. Avatar .png paths to be added when provided.
 */

export type PersonaTier =
  | 'visionaries'   // 90-100%
  | 'naturals'      // 75-89%
  | 'explorers'     // 60-74%
  | 'shifters'      // 45-59%
  | 'awakeners'     // 30-44%
  | 'misfits';      // 0-29%

export interface PersonaCharacter {
  id: string;
  nameKey: string;   // i18n key for name
  taglineKey: string; // i18n key for tagline
  emoji: string;     // fallback until .png provided
  avatarPath?: string; // /images/career-dna/visionaries-1.png etc.
}

export interface PersonaTierDef {
  id: PersonaTier;
  minScore: number;
  maxScore: number;
  nameKey: string;
  characters: PersonaCharacter[];
}

export const PERSONA_TIERS: PersonaTierDef[] = [
  {
    id: 'visionaries',
    minScore: 90,
    maxScore: 100,
    nameKey: 'careerDna.tier.visionaries',
    characters: [
      { id: 'v1', nameKey: 'careerDna.persona.visionaries.v1.name', taglineKey: 'careerDna.persona.visionaries.v1.tagline', emoji: '🌟', avatarPath: '/images/career-dna/The-Visionary.png' },
      { id: 'v2', nameKey: 'careerDna.persona.visionaries.v2.name', taglineKey: 'careerDna.persona.visionaries.v2.tagline', emoji: '✨', avatarPath: '/images/career-dna/The-Visionary.png' },
      { id: 'v3', nameKey: 'careerDna.persona.visionaries.v3.name', taglineKey: 'careerDna.persona.visionaries.v3.tagline', emoji: '💫', avatarPath: '/images/career-dna/The-Visionary.png' },
      { id: 'v4', nameKey: 'careerDna.persona.visionaries.v4.name', taglineKey: 'careerDna.persona.visionaries.v4.tagline', emoji: '🔮', avatarPath: '/images/career-dna/The-Visionary.png' },
    ],
  },
  {
    id: 'naturals',
    minScore: 75,
    maxScore: 89,
    nameKey: 'careerDna.tier.naturals',
    characters: [
      { id: 'n1', nameKey: 'careerDna.persona.naturals.n1.name', taglineKey: 'careerDna.persona.naturals.n1.tagline', emoji: '🌿', avatarPath: '/images/career-dna/The-Natural.png' },
      { id: 'n2', nameKey: 'careerDna.persona.naturals.n2.name', taglineKey: 'careerDna.persona.naturals.n2.tagline', emoji: '🍃', avatarPath: '/images/career-dna/The-Natural.png' },
      { id: 'n3', nameKey: 'careerDna.persona.naturals.n3.name', taglineKey: 'careerDna.persona.naturals.n3.tagline', emoji: '🌱', avatarPath: '/images/career-dna/The-Natural.png' },
      { id: 'n4', nameKey: 'careerDna.persona.naturals.n4.name', taglineKey: 'careerDna.persona.naturals.n4.tagline', emoji: '🌳', avatarPath: '/images/career-dna/The-Natural.png' },
    ],
  },
  {
    id: 'explorers',
    minScore: 60,
    maxScore: 74,
    nameKey: 'careerDna.tier.explorers',
    characters: [
      { id: 'e1', nameKey: 'careerDna.persona.explorers.e1.name', taglineKey: 'careerDna.persona.explorers.e1.tagline', emoji: '🧭', avatarPath: '/images/career-dna/The-Explorer.png' },
      { id: 'e2', nameKey: 'careerDna.persona.explorers.e2.name', taglineKey: 'careerDna.persona.explorers.e2.tagline', emoji: '🗺️', avatarPath: '/images/career-dna/The-Explorer.png' },
      { id: 'e3', nameKey: 'careerDna.persona.explorers.e3.name', taglineKey: 'careerDna.persona.explorers.e3.tagline', emoji: '🔭', avatarPath: '/images/career-dna/The-Explorer.png' },
      { id: 'e4', nameKey: 'careerDna.persona.explorers.e4.name', taglineKey: 'careerDna.persona.explorers.e4.tagline', emoji: '🧗', avatarPath: '/images/career-dna/The-Explorer.png' },
    ],
  },
  {
    id: 'shifters',
    minScore: 45,
    maxScore: 59,
    nameKey: 'careerDna.tier.shifters',
    characters: [
      { id: 's1', nameKey: 'careerDna.persona.shifters.s1.name', taglineKey: 'careerDna.persona.shifters.s1.tagline', emoji: '🦋', avatarPath: '/images/career-dna/The-Shifter.png' },
      { id: 's2', nameKey: 'careerDna.persona.shifters.s2.name', taglineKey: 'careerDna.persona.shifters.s2.tagline', emoji: '🌙', avatarPath: '/images/career-dna/The-Shifter.png' },
      { id: 's3', nameKey: 'careerDna.persona.shifters.s3.name', taglineKey: 'careerDna.persona.shifters.s3.tagline', emoji: '🔄', avatarPath: '/images/career-dna/The-Shifter.png' },
      { id: 's4', nameKey: 'careerDna.persona.shifters.s4.name', taglineKey: 'careerDna.persona.shifters.s4.tagline', emoji: '⚡', avatarPath: '/images/career-dna/The-Shifter.png' },
    ],
  },
  {
    id: 'awakeners',
    minScore: 30,
    maxScore: 44,
    nameKey: 'careerDna.tier.awakeners',
    characters: [
      { id: 'a1', nameKey: 'careerDna.persona.awakeners.a1.name', taglineKey: 'careerDna.persona.awakeners.a1.tagline', emoji: '🌅', avatarPath: '/images/career-dna/The-Awakener.png' },
      { id: 'a2', nameKey: 'careerDna.persona.awakeners.a2.name', taglineKey: 'careerDna.persona.awakeners.a2.tagline', emoji: '🪷', avatarPath: '/images/career-dna/The-Awakener.png' },
      { id: 'a3', nameKey: 'careerDna.persona.awakeners.a3.name', taglineKey: 'careerDna.persona.awakeners.a3.tagline', emoji: '💡', avatarPath: '/images/career-dna/The-Awakener.png' },
      { id: 'a4', nameKey: 'careerDna.persona.awakeners.a4.name', taglineKey: 'careerDna.persona.awakeners.a4.tagline', emoji: '🔓', avatarPath: '/images/career-dna/The-Awakener.png' },
    ],
  },
  {
    id: 'misfits',
    minScore: 0,
    maxScore: 29,
    nameKey: 'careerDna.tier.misfits',
    characters: [
      { id: 'm1', nameKey: 'careerDna.persona.misfits.m1.name', taglineKey: 'careerDna.persona.misfits.m1.tagline', emoji: '🦄', avatarPath: '/images/career-dna/The-Misfit.png' },
      { id: 'm2', nameKey: 'careerDna.persona.misfits.m2.name', taglineKey: 'careerDna.persona.misfits.m2.tagline', emoji: '🎭', avatarPath: '/images/career-dna/The-Misfit.png' },
      { id: 'm3', nameKey: 'careerDna.persona.misfits.m3.name', taglineKey: 'careerDna.persona.misfits.m3.tagline', emoji: '🔥', avatarPath: '/images/career-dna/The-Misfit.png' },
      { id: 'm4', nameKey: 'careerDna.persona.misfits.m4.name', taglineKey: 'careerDna.persona.misfits.m4.tagline', emoji: '💎', avatarPath: '/images/career-dna/The-Misfit.png' },
    ],
  },
];

const TIER_IDS: PersonaTier[] = ['visionaries', 'naturals', 'explorers', 'shifters', 'awakeners', 'misfits'];
const CHARACTER_IDS = ['v1','v2','v3','v4','n1','n2','n3','n4','e1','e2','e3','e4','s1','s2','s3','s4','a1','a2','a3','a4','m1','m2','m3','m4'] as const;

export function getTierFromScore(score: number): PersonaTier {
  for (const tier of PERSONA_TIERS) {
    if (score >= tier.minScore && score <= tier.maxScore) return tier.id;
  }
  return score >= 90 ? 'visionaries' : 'misfits';
}

export function getTierDef(tierId: PersonaTier): PersonaTierDef | undefined {
  return PERSONA_TIERS.find((t) => t.id === tierId);
}

export function getPersonaCharacter(tierId: PersonaTier, characterId: string): PersonaCharacter | undefined {
  const tier = getTierDef(tierId);
  return tier?.characters.find((c) => c.id === characterId);
}

/** Validate tier + character for API response. */
export function isValidPersonaTier(t: string): t is PersonaTier {
  return TIER_IDS.includes(t as PersonaTier);
}

export function isValidPersonaCharacter(c: string): boolean {
  return (CHARACTER_IDS as readonly string[]).includes(c);
}
