import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import { apiPath, apiHeaders, extractApiErrorMessage } from '@/lib/api';
import { debugLog, debugError } from '@/lib/debug';
import { captureException } from '@/lib/error-tracking';
import { z } from 'zod';

const supportSchema = z.object({
  subject: z.string().trim().min(1, 'Subject is required').max(200, 'Subject is too long'),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(2000, 'Message is too long'),
});

export default function Support() {
  const { language, t } = useLanguage();
  const { user, getAccessToken } = useAuth();
  const { isPremium } = useSubscription();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ subject: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = supportSchema.safeParse(formData);
    if (!result.success) {
      toast({
        title: t('support.validationError'),
        description: result.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }
    const token = await getAccessToken();
    if (!token) {
      toast({
        title: t('common.errorTitle'),
        description: t('support.mustSignIn'),
        variant: 'destructive',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(apiPath('/api/support'), {
        method: 'POST',
        headers: apiHeaders('/api/support', token),
        body: JSON.stringify(formData),
      });
      const raw = await res.text();
      let data: Record<string, unknown> = {};
      try {
        if (raw.trim()) data = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        debugLog('Support', 'support API non-JSON response', res.status, raw?.slice(0, 200));
      }
      if (!res.ok) {
        const msg = extractApiErrorMessage(data, res.statusText);
        debugLog('Support', 'support API error', res.status, msg);
        toast({
          title: t('common.errorTitle'),
          description: msg,
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: t('support.requestSent'),
        description: t('support.requestSentDescription'),
      });
      setFormData({ subject: '', message: '' });
    } catch (err) {
      debugError('Support', 'support submit failed', err);
      captureException(err);
      toast({
        title: t('common.errorTitle'),
        description: t('support.sendError'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto max-w-app-content px-4 pb-24 pt-8 sm:pt-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto text-center"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <HelpCircle className="h-7 w-7 text-primary" />
          </div>
          <h1 className="mb-2 text-2xl font-bold">
            {t('support.title')}
          </h1>
          <p className="mb-6 text-muted-foreground">
            {t('support.description')}
          </p>
          {isPremium && (
            <p className="mb-6 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
              {t('support.priorityNote')}
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="public-glass-card rounded-2xl">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="support-subject">
                    {t('support.subject')}
                  </Label>
                  <Input
                    id="support-subject"
                    value={formData.subject}
                    onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                    placeholder={t('support.subjectPlaceholder')}
                    className="mt-1.5"
                    maxLength={200}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="support-message">
                    {t('support.message')}
                  </Label>
                  <Textarea
                    id="support-message"
                    value={formData.message}
                    onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                    placeholder={t('support.messagePlaceholder')}
                    className="mt-1.5 min-h-[120px]"
                    maxLength={2000}
                    disabled={isSubmitting}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="animate-pulse">{t('support.sending')}</span>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      {t('support.submit')}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {t('support.sentFrom')} {user?.email}
        </p>
      </div>
    </Layout>
  );
}
