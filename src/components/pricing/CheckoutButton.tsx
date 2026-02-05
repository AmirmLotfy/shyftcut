import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiFetch } from '@/lib/api';
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
  children 
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user, getAccessToken } = useAuth();
  const { language, t } = useLanguage();
  const { toast } = useToast();

  const handleCheckout = async () => {
    if (!user) {
      const returnTo = metadata?.from === 'careerdna' ? '/upgrade?from=careerdna' : undefined;
      const url = returnTo
        ? `/signup?returnTo=${encodeURIComponent(returnTo)}`
        : '/signup';
      window.location.href = url;
      return;
    }
    const token = await getAccessToken();
    if (!token) {
      toast({ title: t('common.errorTitle'), description: t('auth.sessionExpired'), variant: 'destructive' });
      return;
    }
    const origin = window.location.origin;
    const successUrl = returnTo
      ? `${origin}/checkout/success?returnTo=${encodeURIComponent(returnTo)}`
      : `${origin}/checkout/success`;
    const returnUrl = returnTo ? `${origin}${returnTo}` : `${origin}/upgrade`;
    setIsLoading(true);
    try {
      const data = await apiFetch<{ checkoutUrl?: string }>('/api/checkout/create', {
        method: 'POST',
        token,
        skipUnauthorizedLogout: true,
        body: JSON.stringify({
          planId,
          productId,
          successUrl,
          returnUrl,
          metadata,
        }),
      });

      if (data?.checkoutUrl) {
        window.open(data.checkoutUrl, '_blank', 'noopener,noreferrer');
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      debugError('CheckoutButton', 'checkout create failed', error);
      captureException(error);
      let desc = error instanceof Error ? error.message : (language === 'ar' ? 'حدث خطأ أثناء إنشاء جلسة الدفع' : 'Failed to create checkout session');
      if (desc.toLowerCase().includes('unauthorized') || desc.toLowerCase().includes('session')) {
        desc = t('auth.sessionExpired');
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
