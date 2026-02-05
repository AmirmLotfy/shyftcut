import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassInputWrapper } from '@/components/ui/auth-glass-input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuthLayout, GoogleIcon } from '@/components/auth/AuthLayout';
import { AuthCaptcha, HCAPTCHA_ENABLED } from '@/components/auth/AuthCaptcha';
import type { AuthCaptchaRef } from '@/components/auth/AuthCaptcha';
import { PublicPageMeta } from '@/components/seo/PublicPageMeta';
import { getSeo } from '@/data/seo-content';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { AUTH_HERO_IMAGE, getAuthTestimonials } from '@/lib/auth-testimonials';

type LoginMode = 'password' | 'magiclink';

const LOGIN_MODE_KEY = 'shyftcut-login-mode';
function getStoredLoginMode(): LoginMode {
  try {
    const v = localStorage.getItem(LOGIN_MODE_KEY);
    if (v === 'password' || v === 'magiclink') return v;
  } catch { /* ignore */ }
  return 'password';
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<LoginMode>(getStoredLoginMode);
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | undefined>();
  const captchaRef = useRef<AuthCaptchaRef>(null);
  const { t, language } = useLanguage();
  const { user, signIn, signInWithMagicLink, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const fromLocation = (location.state as { from?: { pathname?: string; search?: string } })?.from;
  const fromPath = fromLocation ? (fromLocation.pathname || '') + (fromLocation.search || '') : null;
  const fromWizard = searchParams.get('from') === 'wizard';
  const fromGuest = searchParams.get('from') === 'guest';
  const redirectTo = (fromPath && fromPath.startsWith('/')) ? fromPath : (fromGuest ? '/wizard?from=guest' : fromWizard ? '/dashboard' : null) ?? '/dashboard';

  useEffect(() => {
    if (user) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, redirectTo, navigate]);

  // Show loading instead of form while redirecting after successful login (avoids flash)
  if (user) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (mode === 'magiclink') {
        await signInWithMagicLink(email, captchaToken);
      } else {
        await signIn(email, password, captchaToken);
      }
      // Don't navigate here - let the useEffect (user watcher) do it after auth state commits.
      // Magic link: no session yet; user will click email link and land back on /login with hash.
    } catch {
      setCaptchaToken(undefined);
      captchaRef.current?.reset();
      // Error is handled in AuthContext
    } finally {
      setIsLoading(false);
      captchaRef.current?.reset();
    }
  };

  const handleGoogleSignIn = () => {
    signInWithGoogle();
  };

  const authTestimonials = getAuthTestimonials(language === 'ar' ? 'ar' : 'en');

  return (
    <div className="bg-background text-foreground min-h-[100dvh]">
      <PublicPageMeta
        title={getSeo("/login", language).title}
        description={getSeo("/login", language).description}
        path="/login"
      />
      <AuthLayout
        heroImageSrc={AUTH_HERO_IMAGE}
        testimonials={authTestimonials}
      >
        <div className="flex flex-col gap-6">
          <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">
            <span className="font-light tracking-tighter">{t('auth.login.title')}</span>
          </h1>
          <p className="animate-element animate-delay-200 text-muted-foreground">
            {t('auth.login.subtitle')}
          </p>
          <p className="animate-element animate-delay-200 text-xs text-muted-foreground" role="status">
            {t('auth.loginGoogleHint')}
          </p>
          {(fromState || fromWizard) && (
            <p className="animate-element animate-delay-200 text-sm text-muted-foreground" role="status">
              {t('auth.pleaseSignIn')}
            </p>
          )}

          <Tabs value={mode} onValueChange={(v) => {
              const m = v as LoginMode;
              setMode(m);
              try { localStorage.setItem(LOGIN_MODE_KEY, m); } catch { /* ignore */ }
            }} className="animate-element animate-delay-250 w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-muted/50 p-1">
              <TabsTrigger value="password" className="rounded-xl">{t('auth.magicLink.tabPassword')}</TabsTrigger>
              <TabsTrigger value="magiclink" className="rounded-xl flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {t('auth.magicLink.tab')}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {mode === 'magiclink' && (
            <p className="animate-element animate-delay-200 text-sm text-muted-foreground">
              {t('auth.magicLink.subtitle')}
            </p>
          )}

          <form data-testid="login-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="animate-element animate-delay-300">
              <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                {t('auth.email')}
              </label>
              <GlassInputWrapper>
                <input
                  data-testid="login-email"
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

            {mode === 'password' && (
              <div className="animate-element animate-delay-400">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-muted-foreground">
                    {t('auth.password')}
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-primary hover:underline transition-colors"
                  >
                    {t('auth.forgotPassword')}
                  </Link>
                </div>
                <GlassInputWrapper>
                  <div className="relative">
                    <input
                      data-testid="login-password"
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                      ) : (
                        <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                      )}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>
            )}

            <div className="animate-element animate-delay-500">
              <AuthCaptcha
                ref={captchaRef}
                onVerify={setCaptchaToken}
                onExpire={() => setCaptchaToken(undefined)}
              />
            </div>

            <Button
              type="submit"
              className="animate-element animate-delay-600 w-full rounded-2xl py-4 font-medium btn-glow"
              disabled={isLoading || (HCAPTCHA_ENABLED && !captchaToken)}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : mode === 'magiclink' ? (
                t('auth.magicLink.button')
              ) : (
                t('auth.login.button')
              )}
            </Button>
          </form>

          <div className="animate-element animate-delay-700 relative flex items-center justify-center">
            <span className="w-full border-t border-border" />
            <span className="px-4 text-sm text-muted-foreground bg-background absolute">
              {t('auth.or')}
            </span>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="animate-element animate-delay-800 w-full flex items-center justify-center gap-3 border border-border rounded-2xl py-4 hover:bg-secondary transition-colors"
          >
            <GoogleIcon />
            {t('auth.google')}
          </button>

          <p className="animate-element animate-delay-900 text-center text-sm text-muted-foreground">
            {t('auth.signup.link')}{' '}
            <Link to="/signup" className="text-primary hover:underline transition-colors font-medium">
              {t('nav.signup')}
            </Link>
          </p>
        </div>
      </AuthLayout>
    </div>
  );
}
