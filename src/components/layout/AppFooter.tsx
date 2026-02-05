import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export function AppFooter() {
  const { language } = useLanguage();
  const currentYear = new Date().getFullYear();
  const isAr = language === 'ar';

  return (
    <footer className="border-t border-border/60 bg-muted/20 py-4 md:py-5" role="contentinfo">
      <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 text-center sm:flex-row sm:gap-4 sm:text-start">
        <Link to="/dashboard" className="text-sm font-semibold gradient-text hover:opacity-90">
          Shyftcut
        </Link>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label={isAr ? 'روابط' : 'Links'}>
          <Link to="/contact" className="transition-colors hover:text-foreground">
            {isAr ? 'تواصل معنا' : 'Contact'}
          </Link>
          <Link to="/terms" className="transition-colors hover:text-foreground">
            {isAr ? 'الشروط' : 'Terms'}
          </Link>
          <Link to="/privacy" className="transition-colors hover:text-foreground">
            {isAr ? 'الخصوصية' : 'Privacy'}
          </Link>
          <Link to="/" className="transition-colors hover:text-foreground">
            {isAr ? 'الرئيسية' : 'Home'}
          </Link>
        </nav>
        <span className="text-xs text-muted-foreground">
          © {currentYear} Shyftcut
        </span>
      </div>
    </footer>
  );
}
