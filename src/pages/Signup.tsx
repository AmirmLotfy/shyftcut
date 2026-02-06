import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassInputWrapper } from '@/components/ui/auth-glass-input';
import { AuthLayout, GoogleIcon } from '@/components/auth/AuthLayout';
import { AuthLayoutMobile } from '@/components/auth/AuthLayoutMobile';
import { useIsMobile } from '@/hooks/use-mobile';
import { PublicPageMeta } from '@/components/seo/PublicPageMeta';
import { getSeo } from '@/data/seo-content';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { validatePassword } from '@/lib/password-validation';
import { AUTH_HERO_IMAGE, getAuthTestimonials } from '@/lib/auth-testimonials';
import { dashboardPaths } from '@/lib/dashboard-routes';

/** Valid return path: starts with / and contains no protocol (avoid open redirect). */
function isValidReturnTo(value: string | null): value is string {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.startsWith('/') && !trimmed.includes('://');
}

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const submittingRef = useRef(false);
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  const { user, signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const justSignedUpRef = useRef(false);
  const fromGuest = searchParams.get('from') === 'guest';
  const rawReturnTo = searchParams.get('returnTo');
  const safeReturnTo = isValidReturnTo(rawReturnTo) ? rawReturnTo.trim() : null;
  const defaultTarget = fromGuest ? '/wizard?from=guest' : dashboardPaths.index;
  const redirectTarget = safeReturnTo ?? defaultTarget;

  useEffect(() => {
    if (user && !justSignedUpRef.current) {
      navigate(redirectTarget, { replace: true });
    }
  }, [user, navigate, redirectTarget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      toast({
        title: t('auth.passwordWeak'),
        description: passwordValidation.message ? t(passwordValidation.message) : undefined,
        variant: 'destructive',
      });
      return;
    }
    submittingRef.current = true;
    justSignedUpRef.current = true;
    setIsLoading(true);
    try {
      await signUp(email, password, name);
      if (typeof window !== 'undefined' && (window as unknown as { Affonso?: { signup: (e: string) => void } }).Affonso?.signup) {
        (window as unknown as { Affonso: { signup: (e: string) => void } }).Affonso.signup(email);
      }
      navigate(redirectTarget, { replace: true });
    } catch {
      justSignedUpRef.current = false;
      submittingRef.current = false;
      // Error is handled in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signInWithGoogle();
  };

  const Layout = isMobile ? AuthLayoutMobile : AuthLayout;
  const layoutProps = isMobile
    ? {}
    : { heroImageSrc: AUTH_HERO_IMAGE, testimonials: getAuthTestimonials(language === 'ar' ? 'ar' : 'en') };

  return (
    <div className="bg-background text-foreground min-h-[100dvh]">
      <PublicPageMeta
        title={getSeo("/signup", language).title}
        description={getSeo("/signup", language).description}
        path="/signup"
      />
      <Layout {...layoutProps}>
        <div className="flex flex-col gap-3 md:gap-4">
          <h1 className={`text-2xl font-semibold leading-tight sm:text-3xl md:text-4xl lg:text-[2.25rem] ${!isMobile ? 'animate-element animate-delay-100' : ''}`}>
            <span className="font-light tracking-tighter">{t('auth.signup.title')}</span>
          </h1>
          <p className="animate-element animate-delay-200 text-muted-foreground">
            {t('auth.signup.subtitle')}
          </p>

          <form data-testid="signup-form" onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
            <div className="animate-element animate-delay-300">
              <label htmlFor="name" className="text-sm font-medium text-muted-foreground">
                {t('auth.name')}
              </label>
              <GlassInputWrapper>
                <input
                  data-testid="signup-name"
                  id="name"
                  name="name"
                  type="text"
                  placeholder={language === 'ar' ? 'أحمد محمد' : 'John Doe'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none"
                  required
                />
              </GlassInputWrapper>
            </div>

            <div className="animate-element animate-delay-400">
              <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                {t('auth.email')}
              </label>
              <GlassInputWrapper>
                <input
                  data-testid="signup-email"
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

            <div className="animate-element animate-delay-500">
              <label htmlFor="password" className="text-sm font-medium text-muted-foreground">
                {t('auth.password')}
              </label>
              <GlassInputWrapper>
                <div className="relative">
                  <input
                    data-testid="signup-password"
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none"
                    minLength={8}
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

            <Button
              type="submit"
              className="animate-element animate-delay-600 w-full rounded-2xl py-4 font-medium btn-glow"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                t('auth.signup.button')
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
            {t('auth.login.link')}{' '}
            <Link to="/login" className="text-primary hover:underline transition-colors font-medium">
              {t('nav.login')}
            </Link>
          </p>
        </div>
      </Layout>
    </div>
  );
}
