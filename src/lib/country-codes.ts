/** Country/region dial codes for phone number input. Common ones first, then alphabetical. */

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
  { code: 'IL', label: 'Israel', dial: '+972' },
  { code: 'AF', label: 'Afghanistan', dial: '+93' },
  { code: 'AL', label: 'Albania', dial: '+355' },
  { code: 'DZ', label: 'Algeria', dial: '+213' },
  { code: 'AD', label: 'Andorra', dial: '+376' },
  { code: 'AO', label: 'Angola', dial: '+244' },
  { code: 'AG', label: 'Antigua and Barbuda', dial: '+1268' },
  { code: 'AM', label: 'Armenia', dial: '+374' },
  { code: 'AW', label: 'Aruba', dial: '+297' },
  { code: 'AZ', label: 'Azerbaijan', dial: '+994' },
  { code: 'BS', label: 'Bahamas', dial: '+1242' },
  { code: 'BH', label: 'Bahrain', dial: '+973' },
  { code: 'BB', label: 'Barbados', dial: '+1246' },
  { code: 'BY', label: 'Belarus', dial: '+375' },
  { code: 'BZ', label: 'Belize', dial: '+501' },
  { code: 'BJ', label: 'Benin', dial: '+229' },
  { code: 'BT', label: 'Bhutan', dial: '+975' },
  { code: 'BO', label: 'Bolivia', dial: '+591' },
  { code: 'BA', label: 'Bosnia and Herzegovina', dial: '+387' },
  { code: 'BW', label: 'Botswana', dial: '+267' },
  { code: 'BN', label: 'Brunei', dial: '+673' },
  { code: 'BG', label: 'Bulgaria', dial: '+359' },
  { code: 'BF', label: 'Burkina Faso', dial: '+226' },
  { code: 'BI', label: 'Burundi', dial: '+257' },
  { code: 'KH', label: 'Cambodia', dial: '+855' },
  { code: 'CM', label: 'Cameroon', dial: '+237' },
  { code: 'CV', label: 'Cape Verde', dial: '+238' },
  { code: 'CL', label: 'Chile', dial: '+56' },
  { code: 'CR', label: 'Costa Rica', dial: '+506' },
  { code: 'HR', label: 'Croatia', dial: '+385' },
  { code: 'CU', label: 'Cuba', dial: '+53' },
  { code: 'CY', label: 'Cyprus', dial: '+357' },
  { code: 'CZ', label: 'Czech Republic', dial: '+420' },
  { code: 'CD', label: 'DR Congo', dial: '+243' },
  { code: 'DJ', label: 'Djibouti', dial: '+253' },
  { code: 'DO', label: 'Dominican Republic', dial: '+1809' },
  { code: 'EC', label: 'Ecuador', dial: '+593' },
  { code: 'SV', label: 'El Salvador', dial: '+503' },
  { code: 'EE', label: 'Estonia', dial: '+372' },
  { code: 'ET', label: 'Ethiopia', dial: '+251' },
  { code: 'FJ', label: 'Fiji', dial: '+679' },
  { code: 'GH', label: 'Ghana', dial: '+233' },
  { code: 'GT', label: 'Guatemala', dial: '+502' },
  { code: 'HN', label: 'Honduras', dial: '+504' },
  { code: 'HK', label: 'Hong Kong', dial: '+852' },
  { code: 'HU', label: 'Hungary', dial: '+36' },
  { code: 'IS', label: 'Iceland', dial: '+354' },
  { code: 'IR', label: 'Iran', dial: '+98' },
  { code: 'IQ', label: 'Iraq', dial: '+964' },
  { code: 'JM', label: 'Jamaica', dial: '+1876' },
  { code: 'JO', label: 'Jordan', dial: '+962' },
  { code: 'KZ', label: 'Kazakhstan', dial: '+7' },
  { code: 'KW', label: 'Kuwait', dial: '+965' },
  { code: 'KG', label: 'Kyrgyzstan', dial: '+996' },
  { code: 'LV', label: 'Latvia', dial: '+371' },
  { code: 'LB', label: 'Lebanon', dial: '+961' },
  { code: 'LS', label: 'Lesotho', dial: '+266' },
  { code: 'LR', label: 'Liberia', dial: '+231' },
  { code: 'LY', label: 'Libya', dial: '+218' },
  { code: 'LI', label: 'Liechtenstein', dial: '+423' },
  { code: 'LT', label: 'Lithuania', dial: '+370' },
  { code: 'LU', label: 'Luxembourg', dial: '+352' },
  { code: 'MO', label: 'Macau', dial: '+853' },
  { code: 'MG', label: 'Madagascar', dial: '+261' },
  { code: 'MW', label: 'Malawi', dial: '+265' },
  { code: 'MV', label: 'Maldives', dial: '+960' },
  { code: 'ML', label: 'Mali', dial: '+223' },
  { code: 'MT', label: 'Malta', dial: '+356' },
  { code: 'MR', label: 'Mauritania', dial: '+222' },
  { code: 'MU', label: 'Mauritius', dial: '+230' },
  { code: 'MD', label: 'Moldova', dial: '+373' },
  { code: 'MC', label: 'Monaco', dial: '+377' },
  { code: 'MN', label: 'Mongolia', dial: '+976' },
  { code: 'ME', label: 'Montenegro', dial: '+382' },
  { code: 'MA', label: 'Morocco', dial: '+212' },
  { code: 'MZ', label: 'Mozambique', dial: '+258' },
  { code: 'MM', label: 'Myanmar', dial: '+95' },
  { code: 'NA', label: 'Namibia', dial: '+264' },
  { code: 'NP', label: 'Nepal', dial: '+977' },
  { code: 'NZ', label: 'New Zealand', dial: '+64' },
  { code: 'NI', label: 'Nicaragua', dial: '+505' },
  { code: 'NE', label: 'Niger', dial: '+227' },
  { code: 'OM', label: 'Oman', dial: '+968' },
  { code: 'PA', label: 'Panama', dial: '+507' },
  { code: 'PG', label: 'Papua New Guinea', dial: '+675' },
  { code: 'PY', label: 'Paraguay', dial: '+595' },
  { code: 'PE', label: 'Peru', dial: '+51' },
  { code: 'QA', label: 'Qatar', dial: '+974' },
  { code: 'RO', label: 'Romania', dial: '+40' },
  { code: 'RW', label: 'Rwanda', dial: '+250' },
  { code: 'RS', label: 'Serbia', dial: '+381' },
  { code: 'SK', label: 'Slovakia', dial: '+421' },
  { code: 'SI', label: 'Slovenia', dial: '+386' },
  { code: 'LK', label: 'Sri Lanka', dial: '+94' },
  { code: 'SD', label: 'Sudan', dial: '+249' },
  { code: 'SZ', label: 'Eswatini', dial: '+268' },
  { code: 'SY', label: 'Syria', dial: '+963' },
  { code: 'TW', label: 'Taiwan', dial: '+886' },
  { code: 'TJ', label: 'Tajikistan', dial: '+992' },
  { code: 'TZ', label: 'Tanzania', dial: '+255' },
  { code: 'TH', label: 'Thailand', dial: '+66' },
  { code: 'TN', label: 'Tunisia', dial: '+216' },
  { code: 'TM', label: 'Turkmenistan', dial: '+993' },
  { code: 'UG', label: 'Uganda', dial: '+256' },
  { code: 'UA', label: 'Ukraine', dial: '+380' },
  { code: 'UY', label: 'Uruguay', dial: '+598' },
  { code: 'UZ', label: 'Uzbekistan', dial: '+998' },
  { code: 'VE', label: 'Venezuela', dial: '+58' },
  { code: 'VN', label: 'Vietnam', dial: '+84' },
  { code: 'YE', label: 'Yemen', dial: '+967' },
  { code: 'ZM', label: 'Zambia', dial: '+260' },
  { code: 'ZW', label: 'Zimbabwe', dial: '+263' },
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

/** Lightweight E.164 validation: + followed by 8–15 digits total. */
export function validatePhone(e164: string): { valid: boolean; error?: string } {
  if (!e164?.trim()) return { valid: false, error: 'Phone number is required' };
  const digits = e164.replace(/\D/g, '');
  if (!e164.startsWith('+') || digits.length < 8 || digits.length > 15) {
    return { valid: false, error: 'Enter a valid phone number (e.g. +1 234 567 8900)' };
  }
  const hasValidPrefix = COUNTRY_CODES.some((c) => {
    const prefix = c.dial.replace(/\D/g, '');
    return digits.startsWith(prefix) && digits.length >= prefix.length + 4;
  });
  if (!hasValidPrefix) {
    return { valid: false, error: 'Unsupported or invalid country code' };
  }
  return { valid: true };
}
