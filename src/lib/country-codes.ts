/** Common country/region dial codes for phone number input. */

export const COUNTRY_CODES: { code: string; label: string; dial: string }[] = [
  { code: 'US', label: 'United States', dial: '+1' },
  { code: 'GB', label: 'United Kingdom', dial: '+44' },
  { code: 'CA', label: 'Canada', dial: '+1' },
  { code: 'AU', label: 'Australia', dial: '+61' },
  { code: 'DE', label: 'Germany', dial: '+49' },
  { code: 'FR', label: 'France', dial: '+33' },
  { code: 'IN', label: 'India', dial: '+91' },
  { code: 'CN', label: 'China', dial: '+86' },
  { code: 'JP', label: 'Japan', dial: '+81' },
  { code: 'BR', label: 'Brazil', dial: '+55' },
  { code: 'MX', label: 'Mexico', dial: '+52' },
  { code: 'ES', label: 'Spain', dial: '+34' },
  { code: 'IT', label: 'Italy', dial: '+39' },
  { code: 'NL', label: 'Netherlands', dial: '+31' },
  { code: 'ZA', label: 'South Africa', dial: '+27' },
  { code: 'NG', label: 'Nigeria', dial: '+234' },
  { code: 'KE', label: 'Kenya', dial: '+254' },
  { code: 'EG', label: 'Egypt', dial: '+20' },
  { code: 'SA', label: 'Saudi Arabia', dial: '+966' },
  { code: 'AE', label: 'UAE', dial: '+971' },
  { code: 'PK', label: 'Pakistan', dial: '+92' },
  { code: 'BD', label: 'Bangladesh', dial: '+880' },
  { code: 'ID', label: 'Indonesia', dial: '+62' },
  { code: 'PH', label: 'Philippines', dial: '+63' },
  { code: 'SG', label: 'Singapore', dial: '+65' },
  { code: 'MY', label: 'Malaysia', dial: '+60' },
  { code: 'KR', label: 'South Korea', dial: '+82' },
  { code: 'PL', label: 'Poland', dial: '+48' },
  { code: 'RU', label: 'Russia', dial: '+7' },
  { code: 'TR', label: 'Turkey', dial: '+90' },
  { code: 'AR', label: 'Argentina', dial: '+54' },
  { code: 'CO', label: 'Colombia', dial: '+57' },
  { code: 'IE', label: 'Ireland', dial: '+353' },
  { code: 'PT', label: 'Portugal', dial: '+351' },
  { code: 'GR', label: 'Greece', dial: '+30' },
  { code: 'BE', label: 'Belgium', dial: '+32' },
  { code: 'CH', label: 'Switzerland', dial: '+41' },
  { code: 'AT', label: 'Austria', dial: '+43' },
  { code: 'SE', label: 'Sweden', dial: '+46' },
  { code: 'NO', label: 'Norway', dial: '+47' },
  { code: 'DK', label: 'Denmark', dial: '+45' },
  { code: 'FI', label: 'Finland', dial: '+358' },
];

/** Parse stored phone (e.g. +12025551234) into { countryCode, nationalNumber }. */
export function parsePhone(stored: string | null | undefined): { countryCode: string; nationalNumber: string } {
  if (!stored?.trim()) return { countryCode: '+1', nationalNumber: '' };
  const s = stored.trim();
  const match = s.match(/^(\+\d{1,4})(\d*)$/);
  if (match) return { countryCode: match[1], nationalNumber: match[2] };
  const digits = s.replace(/\D/g, '');
  if (!digits.length) return { countryCode: '+1', nationalNumber: '' };
  for (const { dial } of [...COUNTRY_CODES].sort((a, b) => b.dial.length - a.dial.length)) {
    const codeDigits = dial.replace(/\D/g, '');
    if (digits.startsWith(codeDigits)) {
      return { countryCode: dial, nationalNumber: digits.slice(codeDigits.length) };
    }
  }
  return { countryCode: '+1', nationalNumber: digits };
}

/** Build E.164-like string from country code and national number. */
export function buildPhone(countryCode: string, nationalNumber: string): string {
  const digits = nationalNumber.replace(/\D/g, '');
  if (!digits) return '';
  const code = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;
  return `${code}${digits}`;
}
