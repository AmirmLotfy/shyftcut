import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassInputWrapper } from '@/components/ui/auth-glass-input';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthCaptcha, HCAPTCHA_ENABLED } from '@/components/auth/AuthCaptcha';
import type { AuthCaptchaRef } from '@/components/auth/AuthCaptcha';
import { PublicPageMeta } from '@/components/seo/PublicPageMeta';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { AUTH_HERO_IMAGE, getAuthTestimonials } from '@/lib/auth-testimonials';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | undefined>();
  const captchaRef = useRef<AuthCaptchaRef>(null);
  const { t, language } = useLanguage();
  const { resetPasswordForEmail } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await resetPasswordForEmail(email, captchaToken);
      setSent(true);
    } catch {
      setCaptchaToken(undefined);
      captchaRef.current?.reset();
      // Error is handled in AuthContext
    } finally {
      setIsLoading(false);
      captchaRef.current?.reset();
    }
  };

  const authTestimonials = getAuthTestimonials(language === 'ar' ? 'ar' : 'en');

  return (
    <div className="bg-background text-foreground min-h-[100dvh]">
      <PublicPageMeta
        title={t('auth.forgotPasswordTitle')}
        description={t('auth.forgotPasswordSubtitle')}
        path="/forgot-password"
      />
      <AuthLayout heroImageSrc={AUTH_HERO_IMAGE} testimonials={authTestimonials}>
        <div className="flex flex-col gap-6">
          <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">
            <span className="font-light tracking-tighter">{t('auth.forgotPasswordTitle')}</span>
          </h1>
          <p className="animate-element animate-delay-200 text-muted-foreground">
            {sent ? t('auth.forgotPasswordSuccessDesc') : t('auth.forgotPasswordSubtitle')}
          </p>

          {sent ? (
            <div className="animate-element animate-delay-300 space-y-5">
              <p className="text-center text-sm text-muted-foreground">
                {t('auth.forgotPasswordSuccess')}
              </p>
              <Button asChild className="w-full rounded-2xl py-4 font-medium btn-glow">
                <Link to="/login">{t('auth.login.button')}</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="animate-element animate-delay-300">
                <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                  {t('auth.email')}
                </label>
                <GlassInputWrapper>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none"
                    required
                  />
                </GlassInputWrapper>
              </div>
              <div className="animate-element animate-delay-400">
                <AuthCaptcha
                  ref={captchaRef}
                  onVerify={setCaptchaToken}
                  onExpire={() => setCaptchaToken(undefined)}
                />
              </div>
              <Button
                type="submit"
                className="animate-element animate-delay-400 w-full rounded-2xl py-4 font-medium btn-glow"
                disabled={isLoading || (HCAPTCHA_ENABLED && !captchaToken)}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  t('auth.forgotPasswordButton')
                )}
              </Button>
            </form>
          )}

          <p className="animate-element animate-delay-500 text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-primary hover:underline transition-colors font-medium">
              ← {t('auth.login.button')}
            </Link>
          </p>
        </div>
      </AuthLayout>
    </div>
  );
}
