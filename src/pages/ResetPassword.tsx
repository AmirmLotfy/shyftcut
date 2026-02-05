import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassInputWrapper } from '@/components/ui/auth-glass-input';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { PublicPageMeta } from '@/components/seo/PublicPageMeta';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { validatePassword } from '@/lib/password-validation';
import { supabase } from '@/lib/supabase';
import { AUTH_HERO_IMAGE, getAuthTestimonials } from '@/lib/auth-testimonials';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hadRecoveryHash] = useState(
    () => typeof window !== 'undefined' && window.location.hash.includes('type=recovery')
  );
  const { t, language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const showForm = hadRecoveryHash && user;
  const showInvalid = !authLoading && !user && !hadRecoveryHash;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      toast({
        title: t('auth.passwordWeak'),
        description: passwordValidation.message ? t(passwordValidation.message) : undefined,
        variant: 'destructive',
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: t('profile.newPasswordsDontMatch'),
        variant: 'destructive',
      });
      return;
    }
    if (!supabase) {
      toast({ title: 'Auth not configured', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({
        title: t('auth.resetPasswordButton'),
        description: t('auth.resetPasswordSuccessDesc'),
      });
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update password';
      toast({ title: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const authTestimonials = getAuthTestimonials(language === 'ar' ? 'ar' : 'en');

  return (
    <div className="bg-background text-foreground min-h-[100dvh]">
      <PublicPageMeta
        title={t('auth.resetPasswordTitle')}
        description={t('auth.resetPasswordSubtitle')}
        path="/reset-password"
      />
      <AuthLayout heroImageSrc={AUTH_HERO_IMAGE} testimonials={authTestimonials}>
        <div className="flex flex-col gap-6">
          <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">
            <span className="font-light tracking-tighter">{t('auth.resetPasswordTitle')}</span>
          </h1>
          <p className="animate-element animate-delay-200 text-muted-foreground">
            {t('auth.resetPasswordSubtitle')}
          </p>

          {authLoading && hadRecoveryHash && (
            <div className="animate-element animate-delay-300 flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="animate-element animate-delay-300">
                <label htmlFor="password" className="text-sm font-medium text-muted-foreground">
                  {t('auth.password')}
                </label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none"
                      required
                      minLength={8}
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
              <div className="animate-element animate-delay-400">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-muted-foreground">
                  {t('auth.confirmPassword')}
                </label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-3 flex items-center"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? (
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
                className="animate-element animate-delay-500 w-full rounded-2xl py-4 font-medium btn-glow"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  t('auth.resetPasswordButton')
                )}
              </Button>
            </form>
          )}

          {showInvalid && (
            <div className="animate-element animate-delay-300 space-y-5">
              <p className="text-center text-sm text-muted-foreground">
                {t('auth.resetPasswordInvalidLinkDesc')}
              </p>
              <Button asChild className="w-full rounded-2xl py-4 font-medium btn-glow">
                <Link to="/forgot-password">{t('auth.forgotPasswordTitle')}</Link>
              </Button>
            </div>
          )}

          <p className="animate-element animate-delay-600 text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-primary hover:underline transition-colors font-medium">
              ← {t('auth.login.button')}
            </Link>
          </p>
        </div>
      </AuthLayout>
    </div>
  );
}
