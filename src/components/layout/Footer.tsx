import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { IconInstagram, IconFacebook, IconLinkedin } from '@/lib/icons';
import { LOGO_PATH } from '@/lib/seo';
import { NewsletterSignup } from '@/components/footer/NewsletterSignup';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const productLinks = [
  { to: '/pricing', labelKey: { en: 'Pricing', ar: 'الأسعار' } },
  { to: '/roadmap', labelKey: { en: 'Roadmap', ar: 'خارطة الطريق' } },
  { to: '/courses', labelKey: { en: 'Courses', ar: 'الدورات' } },
  { to: '/chat', labelKey: { en: 'AI Coach', ar: 'المدرب الذكي' } },
];

const companyLinks = [
  { to: '/about', labelKey: { en: 'About', ar: 'عنّا' } },
  { to: '/blog', labelKey: { en: 'Blog', ar: 'المدونة' } },
  { to: '/contact', labelKey: { en: 'Contact', ar: 'اتصل بنا' } },
];

const legalLinks = [
  { to: '/privacy', labelKey: { en: 'Privacy', ar: 'الخصوصية' } },
  { to: '/terms', labelKey: { en: 'Terms', ar: 'الشروط' } },
  { to: '/cookies', labelKey: { en: 'Cookies', ar: 'الكوكيز' } },
  { to: '/refund', labelKey: { en: 'Refund', ar: 'الاسترداد' } },
];

const socialLinks = [
  { href: 'https://www.instagram.com/shyftcut', label: 'Instagram', Icon: IconInstagram },
  { href: 'https://www.facebook.com/shyftcut/', label: 'Facebook', Icon: IconFacebook },
  { href: 'https://www.linkedin.com/company/shyftcut/', label: 'LinkedIn', Icon: IconLinkedin },
];

function LinkColumn({
  title,
  links,
  language,
}: {
  title: string;
  links: typeof productLinks;
  language: string;
}) {
  return (
    <nav className="min-w-0" aria-label={title}>
      <h3 className="mb-4 text-lg font-semibold">{title}</h3>
      <ul className="flex flex-col gap-2">
        {links.map(({ to, labelKey }) => (
          <li key={to}>
            <Link
              to={to}
              className="block text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {labelKey[language as keyof typeof labelKey]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Footer() {
  const { language } = useLanguage();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const currentYear = new Date().getFullYear();
  const isAr = language === 'ar';

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === 'dark' || theme === 'dark');

  return (
    <footer
      className="relative min-w-0 max-w-full overflow-x-clip border-t border-border bg-background text-foreground transition-colors duration-300"
      role="contentinfo"
    >
      <div className="container mx-auto px-4 py-12 sm:px-6 md:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Stay Connected / Newsletter — reference pattern with glow */}
          <div className="relative">
            <h2 className="mb-4 text-3xl font-bold tracking-tight">
              {isAr ? 'ابقَ على تواصل' : 'Stay Connected'}
            </h2>
            <p className="mb-6 text-muted-foreground">
              {isAr
                ? 'انضم إلى نشرتنا لأحدث التحديثات ونصائح المهنة.'
                : 'Join our newsletter for the latest updates and career tips.'}
            </p>
            <div className="public-glass-card rounded-2xl px-4 py-5 shadow-sm md:px-6 md:py-7">
              <NewsletterSignup variant="footer" />
            </div>
            <div
              className="pointer-events-none absolute -right-4 top-0 h-24 w-24 rounded-full bg-primary/10 blur-2xl"
              aria-hidden
            />
          </div>

          {/* Quick Links — Product */}
          <div className="hidden md:block">
            <LinkColumn
              title={isAr ? 'المنتج' : 'Product'}
              links={productLinks}
              language={language}
            />
          </div>

          {/* Company */}
          <div className="hidden md:block">
            <LinkColumn
              title={isAr ? 'الشركة' : 'Company'}
              links={companyLinks}
              language={language}
            />
          </div>

          {/* Follow Us — social + theme toggle */}
          <div className="relative">
            <h3 className="mb-4 text-lg font-semibold">
              {isAr ? 'تابعنا' : 'Follow Us'}
            </h3>
            <div className="mb-6 flex flex-wrap gap-3">
              {socialLinks.map(({ href, label, Icon }) => (
                <Tooltip key={label}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full h-10 w-10"
                      asChild
                    >
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {label === 'Instagram' && (isAr ? 'تابعنا على إنستغرام' : 'Follow us on Instagram')}
                      {label === 'Facebook' && (isAr ? 'تابعنا على فيسبوك' : 'Follow us on Facebook')}
                      {label === 'LinkedIn' && (isAr ? 'تواصل معنا على لينكدإن' : 'Connect with us on LinkedIn')}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
            {mounted && (
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-muted-foreground" />
                <Switch
                  id="footer-dark-mode"
                  checked={isDark}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
                <Moon className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="footer-dark-mode" className="sr-only">
                  {isAr ? 'الوضع الداكن' : 'Toggle dark mode'}
                </Label>
              </div>
            )}
          </div>
        </div>

        {/* Mobile: accordion for links */}
        <div className="mt-8 lg:hidden">
          <Accordion type="single" collapsible defaultValue="">
            <AccordionItem value="product" className="border-border/50 border-b px-0">
              <AccordionTrigger className="py-4 text-start text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground hover:no-underline [&[data-state=open]]:text-foreground">
                {isAr ? 'المنتج' : 'Product'}
              </AccordionTrigger>
              <AccordionContent className="pb-4 pt-0">
                <ul className="flex flex-col gap-2">
                  {productLinks.map(({ to, labelKey }) => (
                    <li key={to}>
                      <Link
                        to={to}
                        className="block py-2 text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        {labelKey[language]}
                      </Link>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="company" className="border-border/50 border-b px-0">
              <AccordionTrigger className="py-4 text-start text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground hover:no-underline [&[data-state=open]]:text-foreground">
                {isAr ? 'الشركة' : 'Company'}
              </AccordionTrigger>
              <AccordionContent className="pb-4 pt-0">
                <ul className="flex flex-col gap-2">
                  {companyLinks.map(({ to, labelKey }) => (
                    <li key={to}>
                      <Link
                        to={to}
                        className="block py-2 text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        {labelKey[language]}
                      </Link>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Bottom bar — reference pattern */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-center md:flex-row md:text-start rtl:md:text-end">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Shyftcut. {isAr ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-4 text-sm" aria-label={isAr ? 'روابط قانونية' : 'Legal links'}>
            <Link to="/privacy" className="transition-colors hover:text-primary">
              {isAr ? 'الخصوصية' : 'Privacy Policy'}
            </Link>
            <Link to="/terms" className="transition-colors hover:text-primary">
              {isAr ? 'الشروط' : 'Terms of Service'}
            </Link>
            <Link to="/cookies" className="transition-colors hover:text-primary">
              {isAr ? 'إعدادات الكوكيز' : 'Cookie Settings'}
            </Link>
            <a
              href="https://frameless.co"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary/90 transition-colors hover:text-primary"
            >
              {isAr ? 'تطبيق من Frameless' : 'A Frameless App'}
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
