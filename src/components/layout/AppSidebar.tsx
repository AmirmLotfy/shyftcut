import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  IconMapTrifold,
  IconBookOpen,
  IconMessageSquare,
  IconUser,
  IconUsers,
  IconSignOut,
  IconSparkle,
  IconClock,
  IconBriefcase,
} from '@/lib/icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { LOGO_PATH } from '@/lib/seo';

const appNavItems = [
  { href: '/dashboard', labelKey: { en: 'Dashboard', ar: 'لوحة التحكم' }, icon: IconMapTrifold },
  { href: '/roadmap', labelKey: { en: 'Roadmap', ar: 'خارطة الطريق' }, icon: IconMapTrifold },
  { href: '/study', labelKey: { en: 'Focus', ar: 'التركيز (Focus)' }, icon: IconClock },
  { href: '/courses', labelKey: { en: 'Courses', ar: 'الدورات' }, icon: IconBookOpen },
  { href: '/chat', labelKey: { en: 'AI Coach', ar: 'المدرب الذكي' }, icon: IconMessageSquare },
  { href: '/career-tools', labelKey: { en: 'Career Tools', ar: 'أدوات مهنية' }, icon: IconBriefcase },
  { href: '/community', labelKey: { en: 'Community', ar: 'المجتمع' }, icon: IconUsers },
];

export function AppSidebar() {
  const { pathname } = useLocation();
  const { language, t, direction } = useLanguage();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/community') return pathname === '/community';
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navLabel = language === 'ar' ? 'تنقل' : 'Navigate';

  return (
    <Sidebar side={direction === 'rtl' ? 'right' : 'left'} variant="sidebar" collapsible="offcanvas">
      <SidebarHeader className="border-b border-sidebar-border bg-sidebar/80">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 rounded-lg px-3 py-2.5 transition-colors hover:bg-sidebar-accent"
        >
          <img
            src={LOGO_PATH}
            alt="Shyftcut"
            width={28}
            height={28}
            className="h-8 w-8 shrink-0 object-contain"
            decoding="async"
          />
          <span className="text-lg font-bold gradient-text">Shyftcut</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="bg-gradient-to-b from-sidebar to-sidebar/95">
        <SidebarGroup>
          <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60">
            {navLabel}
          </h3>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {appNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    className="mx-2 rounded-lg border-l-2 border-transparent rtl:border-l-0 rtl:border-r-2 data-[active=true]:border-primary data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium"
                  >
                    <Link to={item.href} className="flex items-center gap-3 py-2.5">
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.labelKey[language as keyof typeof item.labelKey]}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
            <SidebarMenuItem>
              <div className="mx-2 mt-3 rounded-xl border border-primary/20 bg-primary/10 p-2">
                <SidebarMenuButton asChild className="h-auto w-full justify-center rounded-lg bg-primary/10 py-2.5 text-primary hover:bg-primary/20 hover:text-primary">
                  <Link to="/wizard">
                    <IconSparkle className="h-4 w-4 shrink-0" />
                    <span className="font-semibold">{language === 'ar' ? 'إنشاء خريطة طريق' : 'Create roadmap'}</span>
                  </Link>
                </SidebarMenuButton>
              </div>
            </SidebarMenuItem>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {user && (
        <SidebarFooter className="border-t border-sidebar-border bg-sidebar/80 pt-4">
          <SidebarMenu className="gap-0.5">
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/profile'}
                className="mx-2 rounded-lg border-l-2 border-transparent rtl:border-l-0 rtl:border-r-2 data-[active=true]:border-primary data-[active=true]:bg-sidebar-accent"
              >
                <Link to="/profile" className="flex items-center gap-3 py-2.5">
                  <IconUser className="h-4 w-4 shrink-0" />
                  <span>{t('nav.profile')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleSignOut}
                className="mx-2 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <IconSignOut className="h-4 w-4 shrink-0" />
                <span>{t('nav.logout')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <div className="mt-4 space-y-2 border-t border-sidebar-border pt-4">
            <nav className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground" aria-label={language === 'ar' ? 'روابط' : 'Links'}>
              <Link to="/dashboard" className="hover:text-foreground">Shyftcut</Link>
              <Link to="/support" className="hover:text-foreground">{language === 'ar' ? 'الدعم' : 'Support'}</Link>
              <Link to="/contact" className="hover:text-foreground">{language === 'ar' ? 'تواصل' : 'Contact'}</Link>
              <Link to="/terms" className="hover:text-foreground">{language === 'ar' ? 'الشروط' : 'Terms'}</Link>
              <Link to="/privacy" className="hover:text-foreground">{language === 'ar' ? 'الخصوصية' : 'Privacy'}</Link>
            </nav>
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Shyftcut</p>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
