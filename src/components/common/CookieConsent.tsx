import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const COOKIE_CONSENT_KEY = 'shyftcut-cookie-consent';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Delay showing banner for better UX
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      accepted: true,
      timestamp: new Date().toISOString(),
      preferences: { essential: true, functional: true, analytics: true }
    }));
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      accepted: false,
      timestamp: new Date().toISOString(),
      preferences: { essential: true, functional: false, analytics: false }
    }));
    setShowBanner(false);
  };

  const content = {
    en: {
      title: 'We use cookies',
      description: 'We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.',
      accept: 'Accept All',
      decline: 'Essential Only',
      learnMore: 'Learn more',
    },
    ar: {
      title: 'نستخدم ملفات تعريف الارتباط',
      description: 'نستخدم ملفات تعريف الارتباط لتحسين تجربة التصفح الخاصة بك، وتقديم محتوى مخصص، وتحليل حركة المرور. بالنقر على "قبول الكل"، فإنك توافق على استخدامنا لملفات تعريف الارتباط.',
      accept: 'قبول الكل',
      decline: 'الأساسية فقط',
      learnMore: 'اقرأ المزيد',
    },
  };

  const t = content[language];

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
        >
          <div className="mx-auto max-w-6xl">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-background/95 p-4 shadow-2xl backdrop-blur-xl md:p-6">
              {/* Gradient accent */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />
              
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                {/* Content */}
                <div className="flex items-start gap-4 md:items-center">
                  <div className="hidden shrink-0 rounded-full bg-primary/10 p-3 md:flex">
                    <Cookie className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1 flex items-center gap-2 font-semibold">
                      <Cookie className="h-5 w-5 text-primary md:hidden" />
                      {t.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t.description}{' '}
                      <Link 
                        to="/cookies" 
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {t.learnMore}
                      </Link>
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Button
                    variant="outline"
                    onClick={handleDecline}
                    className="order-2 sm:order-1"
                  >
                    {t.decline}
                  </Button>
                  <Button
                    onClick={handleAccept}
                    className="order-1 btn-glow sm:order-2"
                  >
                    {t.accept}
                  </Button>
                </div>
              </div>

              {/* Close button for mobile */}
              <button
                onClick={handleDecline}
                className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden rtl:right-auto rtl:left-3"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
