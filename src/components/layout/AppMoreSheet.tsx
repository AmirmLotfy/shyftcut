import { Link } from 'react-router-dom';
import {
  BookOpen,
  Briefcase,
  Sparkles,
  Home,
  CreditCard,
  HelpCircle,
  Users,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { getUpgradePath } from '@/lib/upgrade-link';
import { LOGO_PATH } from '@/lib/seo';

interface AppMoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const moreNavItems = [
  { href: '/courses', labelKey: { en: 'Courses', ar: 'الدورات' }, icon: BookOpen },
  { href: '/career-tools', labelKey: { en: 'Career Tools', ar: 'أدوات المهنة' }, icon: Briefcase },
  { href: '/community', labelKey: { en: 'Community', ar: 'المجتمع' }, icon: Users },
  { href: '/wizard', labelKey: { en: 'Create roadmap', ar: 'إنشاء خريطة طريق' }, icon: Sparkles },
  { href: '/support', labelKey: { en: 'Support', ar: 'الدعم' }, icon: HelpCircle },
  { href: '/', labelKey: { en: 'Home', ar: 'الرئيسية' }, icon: Home },
  { href: 'upgrade', labelKey: { en: 'Upgrade', ar: 'ترقية' }, icon: CreditCard, isUpgrade: true },
];

/**
 * Bottom sheet for mobile app "More" menu — Courses, Career Tools, Create roadmap, Home, Upgrade.
 */
export function AppMoreSheet({ open, onOpenChange }: AppMoreSheetProps) {
  const { language } = useLanguage();
  const { user } = useAuth();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex max-h-[85dvh] flex-col rounded-t-3xl border-t border-border/80 bg-background px-0 pb-0 pt-0 shadow-2xl [&>button]:hidden"
      >
        <div className="shrink-0 border-b border-border/50 bg-muted/20 px-4 pb-4 pt-5">
          <div className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
          <SheetHeader className="text-start">
            <SheetTitle className="flex items-center gap-3">
              <img
                src={LOGO_PATH}
                alt="Shyftcut"
                width={36}
                height={36}
                className="h-9 w-9 shrink-0 object-contain"
                decoding="async"
              />
              <span className="gradient-text text-xl font-bold">
                {language === 'ar' ? 'المزيد' : 'More'}
              </span>
            </SheetTitle>
          </SheetHeader>
        </div>

        <nav
          className="flex flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4"
          aria-label="More navigation"
        >
          {moreNavItems.map((item) => {
            const Icon = item.icon;
            const href = item.isUpgrade ? getUpgradePath(user) : item.href;
            return (
              <Link
                key={item.href + (item.isUpgrade ? '-upgrade' : '')}
                to={href}
                onClick={() => {
                  onOpenChange(false);
                }}
                className="flex min-touch items-center gap-3 rounded-xl px-4 py-3.5 text-[15px] font-medium transition-colors hover:bg-muted/80 active:bg-muted"
              >
                <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                <span>{item.labelKey[language as keyof typeof item.labelKey]}</span>
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
