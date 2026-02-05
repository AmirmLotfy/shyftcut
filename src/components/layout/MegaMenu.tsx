import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconMapTrifold,
  IconBook2,
  IconMessageSquare,
  IconCreditCard,
  IconBookOpen,
} from '@/lib/icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { getUpgradePath } from '@/lib/upgrade-link';

const productLinks = (upgradeHref: string) => [
  {
    href: '/roadmap',
    icon: IconMapTrifold,
    titleKey: { en: 'Roadmap', ar: 'خريطة الطريق' },
    descKey: { en: 'Your 12-week career path', ar: 'مسارك المهني 12 أسبوعاً' },
  },
  {
    href: '/courses',
    icon: IconBook2,
    titleKey: { en: 'Courses', ar: 'الدورات' },
    descKey: { en: 'Verified course library', ar: 'مكتبة دورات موثقة' },
  },
  {
    href: '/chat',
    icon: IconMessageSquare,
    titleKey: { en: 'AI Coach', ar: 'المدرب الذكي' },
    descKey: { en: '24/7 career guidance', ar: 'توجيه مهني على مدار الساعة' },
  },
  {
    href: upgradeHref,
    icon: IconCreditCard,
    titleKey: { en: 'Pricing', ar: 'الأسعار' },
    descKey: { en: 'Simple, transparent plans', ar: 'خطط بسيطة وشفافة' },
  },
];

interface MegaMenuProps {
  open: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
}

export function MegaMenu({ open, onClose, anchorRef }: MegaMenuProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const links = productLinks(getUpgradePath(user));

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="absolute left-0 right-0 top-full z-50 pt-2 md:left-1/2 md:right-auto md:-translate-x-1/2 md:pt-3"
        >
          <div
            className="rounded-2xl border border-border/50 bg-background/95 shadow-xl backdrop-blur-xl dark:bg-card/95"
            style={{
              boxShadow: '0 20px 60px -15px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)',
            }}
          >
            <div className="grid gap-px p-2 md:grid-cols-2 md:p-3">
              {links.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={onClose}
                    className="flex min-touch items-center gap-4 rounded-xl px-4 py-3 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{item.titleKey[language]}</div>
                      <div className="text-xs text-muted-foreground">{item.descKey[language]}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="border-t border-border/50 px-3 py-2">
              <Link
                to="/blog"
                onClick={onClose}
                className="flex min-touch items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                <IconBookOpen className="h-4 w-4" />
                {language === 'ar' ? 'المدونة' : 'Blog'}
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
