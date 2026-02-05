import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiPath, apiHeaders, extractApiErrorMessage } from '@/lib/api';
import { debugLog, debugError } from '@/lib/debug';
import { captureException } from '@/lib/error-tracking';
import { Send, Check, Loader2 } from 'lucide-react';
import { IconArrowRight } from '@/lib/icons';

type NewsletterVariant = 'default' | 'footer';

export function NewsletterSignup({ variant = 'default' }: { variant?: NewsletterVariant }) {
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const isFooter = variant === 'footer';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    setErrorMessage('');
    try {
      const res = await fetch(apiPath('/api/newsletter'), {
        method: 'POST',
        headers: apiHeaders('/api/newsletter', null),
        body: JSON.stringify({ email: email.trim() }),
      });
      const raw = await res.text();
      let data: Record<string, unknown> = {};
      try {
        if (raw.trim()) data = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        debugLog('NewsletterSignup', 'newsletter API non-JSON response', res.status);
      }
      if (!res.ok) {
        const msg = extractApiErrorMessage(data, res.statusText);
        debugLog('NewsletterSignup', 'newsletter API error', res.status, msg);
        setErrorMessage(msg === 'Already subscribed' ? (language === 'ar' ? 'أنت مشترك بالفعل' : 'Already subscribed') : msg);
        setStatus('error');
        return;
      }
      setStatus('success');
      setEmail('');
    } catch (err) {
      debugError('NewsletterSignup', 'newsletter submit failed', err);
      captureException(err);
      setErrorMessage(language === 'ar' ? 'حدث خطأ' : 'Something went wrong');
      setStatus('error');
    }
  };

  return (
    <div className={isFooter ? 'space-y-4' : 'space-y-3'}>
      <div>
        <p className={isFooter ? 'text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground' : 'text-xs font-semibold uppercase tracking-wider text-muted-foreground'}>
          {language === 'ar' ? 'النشرة البريدية' : 'Newsletter'}
        </p>
        <p className={isFooter ? 'mt-1.5 text-sm text-muted-foreground sm:mt-2' : 'mt-0 text-sm text-muted-foreground max-w-md'}>
          {language === 'ar'
            ? 'انضم إلى 5,000+ مشترك. نصائح مهنية وأخبار Shyftcut.'
            : 'Join 5,000+ subscribers. Career tips and Shyftcut updates.'}
        </p>
      </div>
      <form data-testid="newsletter-form" onSubmit={handleSubmit} className={isFooter ? 'relative max-w-md' : 'flex flex-col gap-2 sm:flex-row sm:items-center'}>
        {isFooter ? (
          <>
            <Input
              data-testid="newsletter-email"
              type="email"
              placeholder={language === 'ar' ? 'بريدك الإلكتروني' : 'Enter your email'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pr-12 backdrop-blur-sm rounded-xl border-border/60 bg-background/80"
              disabled={status === 'loading'}
              required
            />
            <Button
              type="submit"
              data-testid="newsletter-submit"
              size="icon"
              className="absolute right-1 top-1 h-8 w-8 rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 rtl:right-auto rtl:left-1"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : status === 'success' ? (
                <Check className="h-4 w-4" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="sr-only">{language === 'ar' ? 'اشترك' : 'Subscribe'}</span>
            </Button>
          </>
        ) : (
          <>
            <Input
              data-testid="newsletter-email"
              type="email"
              placeholder={language === 'ar' ? 'بريدك الإلكتروني' : 'your@email.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-w-0 flex-1"
              disabled={status === 'loading'}
              required
            />
            <Button
              type="submit"
              data-testid="newsletter-submit"
              size="default"
              className="btn-glow shrink-0 gap-1"
              disabled={status === 'loading'}
            >
              {status === 'loading'
                ? (language === 'ar' ? 'جاري...' : '...')
                : status === 'success'
                  ? (language === 'ar' ? 'تم!' : 'Done!')
                  : (language === 'ar' ? 'اشترك' : 'Subscribe')}
              {status !== 'success' && <IconArrowRight className="h-4 w-4" />}
            </Button>
          </>
        )}
      </form>
      {status === 'error' && errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}
    </div>
  );
}
