import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/hooks/useProfile';

/**
 * When the user is authenticated and profile has loaded, sync preferred_language
 * from profile to LanguageContext (and thus to document dir/lang and localStorage).
 * Mounted inside the app shell so it runs for all authenticated app routes.
 */
export function ProfileLanguageSync() {
  const { user } = useAuth();
  const { profile, isLoading } = useProfile();
  const { setLanguage, language } = useLanguage();

  useEffect(() => {
    if (!user || isLoading || !profile) return;
    const preferred = (profile as { preferred_language?: string })?.preferred_language;
    if (preferred !== 'en' && preferred !== 'ar') return;
    if (language === preferred) return;
    setLanguage(preferred);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('shyftcut-language', preferred);
    }
  }, [user, profile, isLoading, setLanguage, language]);

  return null;
}
