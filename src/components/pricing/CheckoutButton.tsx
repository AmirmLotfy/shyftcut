import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiFetch } from '@/lib/api';
import { dashboardPaths } from '@/lib/dashboard-routes';
import { debugError } from '@/lib/debug';
import { captureException } from '@/lib/error-tracking';
import { useToast } from '@/hooks/use-toast';

interface CheckoutButtonProps {
  planId: 'premium';
  productId: string;
  priceId?: string;
  className?: string;
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** Path to return to after success or cancel (e.g. '/dashboard'). Must start with /. */
  returnTo?: string;
  /** Metadata to pass to checkout (e.g. { from: 'careerdna' } for discount). */
  metadata?: Record<string, string>;
  /** If true, redirects to upgrade page instead of opening Polar checkout directly */
  redirectToUpgrade?: boolean;
  children?: React.ReactNode;
}

export function CheckoutButton({ 
  planId, 
  productId, 
  className, 
  variant = 'default',
  size,
  returnTo,
  metadata,
  redirectToUpgrade = false,
  children 
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user, getAccessTokenFresh } = useAuth();
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCheckout = async () => {
    // If redirectToUpgrade is true, navigate to upgrade page instead
    if (redirectToUpgrade) {
      const upgradePath = returnTo 
        ? `${dashboardPaths.upgrade}?returnTo=${encodeURIComponent(returnTo)}`
        : dashboardPaths.upgrade;
      navigate(upgradePath);
      return;
    }
    if (!user) {
      const guestReturnTo = metadata?.from === 'careerdna' ? `${dashboardPaths.upgrade}?from=careerdna` : undefined;
      const url = guestReturnTo
        ? `/signup?returnTo=${encodeURIComponent(guestReturnTo)}`
        : '/signup';
      window.location.href = url;
      return;
    }
    const origin = window.location.origin;
    const checkoutBody = {
      planId,
      productId,
      successUrl: returnTo
        ? `${origin}${dashboardPaths.checkoutSuccess}?returnTo=${encodeURIComponent(returnTo)}`
        : `${origin}${dashboardPaths.checkoutSuccess}`,
      returnUrl: returnTo ? `${origin}${returnTo}` : `${origin}${dashboardPaths.upgrade}`,
      metadata: { ...metadata, ...(typeof window !== 'undefined' && (window as unknown as { affonso_referral?: string }).affonso_referral ? { affonso_referral: (window as unknown as { affonso_referral: string }).affonso_referral } : {}) },
    };

    const doCheckout = async (accessToken: string): Promise<{ checkoutUrl?: string }> =>
      apiFetch<{ checkoutUrl?: string }>('/api/checkout/create', {
        method: 'POST',
        token: accessToken,
        skipUnauthorizedLogout: true,
        body: JSON.stringify(checkoutBody),
      });

    let token = await getAccessTokenFresh();
    if (!token) {
      toast({ title: t('common.errorTitle'), description: t('auth.sessionExpired'), variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      let data: { checkoutUrl?: string } | null = null;
      try {
        data = await doCheckout(token);
      } catch (firstErr) {
        const err = firstErr as Error & { code?: string; status?: number };
        const is401 = err?.status === 401 || (typeof err?.message === 'string' && err.message.toLowerCase().includes('unauthorized'));
        debugError('CheckoutButton', 'checkout create failed (first attempt)', firstErr, err?.code);
        if (is401) {
          token = await getAccessTokenFresh() ?? undefined;
          if (token) data = await doCheckout(token).catch(() => null) ?? null;
        }
        if (!data?.checkoutUrl) throw firstErr;
      }
      if (data?.checkoutUrl) {
        window.open(data.checkoutUrl, '_blank', 'noopener,noreferrer');
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      const err = error as Error & { code?: string };
      debugError('CheckoutButton', 'checkout create failed', error, err?.code);
      if (err?.code) console.error('[CheckoutButton] 401 auth code:', err.code);
      captureException(error);
      let desc = error instanceof Error ? error.message : (language === 'ar' ? 'حدث خطأ أثناء إنشاء جلسة الدفع' : 'Failed to create checkout session');
      if (desc.toLowerCase().includes('unauthorized') || desc.toLowerCase().includes('session')) {
        desc = t('auth.sessionExpired');
        if (err?.code) desc += ` (${err.code})`;
      }
      toast({
        title: t('common.errorTitle'),
        description: desc,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className}
      data-testid="checkout-button"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:mr-0 rtl:ml-2" />
          {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
        </>
      ) : (
        children || (language === 'ar' ? 'ترقية الآن' : 'Upgrade Now')
      )}
    </Button>
  );
}
