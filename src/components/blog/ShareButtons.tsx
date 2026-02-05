import { Twitter, Linkedin, Facebook, Link2, Check, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface ShareButtonsProps {
  url: string;
  title: string;
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const { language, t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}&via=shyftcut`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
  };

  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title,
        url,
        text: title,
      });
      toast({
        title: language === 'ar' ? 'تم المشاركة!' : 'Shared!',
        description: language === 'ar' ? 'شكراً للمشاركة' : 'Thanks for sharing',
      });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        toast({
          title: t('common.errorTitle'),
          description: language === 'ar' ? 'فشلت المشاركة' : 'Share failed',
          variant: 'destructive',
        });
      }
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: language === 'ar' ? 'تم النسخ!' : 'Copied!',
        description: language === 'ar' ? 'تم نسخ الرابط إلى الحافظة' : 'Link copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: t('common.errorTitle'),
        description: language === 'ar' ? 'فشل نسخ الرابط' : 'Failed to copy link',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">
        {language === 'ar' ? 'شارك:' : 'Share:'}
      </span>
      {/* Native share first on mobile for real system share sheet */}
      {canNativeShare && (
        <Button
          variant="default"
          size="icon"
          className="h-9 w-9 shrink-0 shadow-sm"
          onClick={handleNativeShare}
          aria-label={language === 'ar' ? 'مشاركة (النظام)' : 'Share (native)'}
          title={language === 'ar' ? 'مشاركة' : 'Share'}
        >
          <Share2 className="h-4 w-4" />
        </Button>
      )}
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        onClick={() => window.open(shareLinks.twitter, '_blank', 'noopener,noreferrer')}
        aria-label="Share on X"
      >
        <Twitter className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        onClick={() => window.open(shareLinks.linkedin, '_blank', 'noopener,noreferrer')}
        aria-label="Share on LinkedIn"
      >
        <Linkedin className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        onClick={() => window.open(shareLinks.facebook, '_blank', 'noopener,noreferrer')}
        aria-label="Share on Facebook"
      >
        <Facebook className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        onClick={copyToClipboard}
        aria-label={language === 'ar' ? 'نسخ الرابط' : 'Copy link'}
      >
        {copied ? <Check className="h-4 w-4 text-success" /> : <Link2 className="h-4 w-4" />}
      </Button>
    </div>
  );
}
