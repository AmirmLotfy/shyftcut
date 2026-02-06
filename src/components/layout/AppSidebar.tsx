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
  IconMagicWand,
  IconClock,
  IconBriefcase,
  IconGift,
} from '@/lib/icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { LOGO_PATH } from '@/lib/seo';
import { prefetchRoute } from '@/lib/route-prefetch';
import { dashboardPaths, isDashboardPath } from '@/lib/dashboard-routes';

const appNavItems = [
  { href: dashboardPaths.index, labelKey: { en: 'Dashboard', ar: 'لوحة التحكم' }, icon: IconMapTrifold },
  { href: dashboardPaths.roadmap, labelKey: { en: 'Roadmap', ar: 'خارطة الطريق' }, icon: IconMapTrifold },
  { href: dashboardPaths.study, labelKey: { en: 'Focus', ar: 'التركيز (Focus)' }, icon: IconClock },
  { href: dashboardPaths.courses, labelKey: { en: 'Courses', ar: 'الدورات' }, icon: IconBookOpen },
  { href: dashboardPaths.chat, labelKey: { en: 'AI Coach', ar: 'المدرب الذكي' }, icon: IconMessageSquare },
  { href: dashboardPaths.careerTools, labelKey: { en: 'Career Tools', ar: 'أدوات مهنية' }, icon: IconBriefcase },
  { href: dashboardPaths.community, labelKey: { en: 'Community', ar: 'المجتمع' }, icon: IconUsers },
];

export function AppSidebar() {
  const { pathname } = useLocation();
  const { language, t, direction } = useLanguage();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const isActive = (href: string) => {
    if (href === dashboardPaths.index) return pathname === dashboardPaths.index;
    if (href === dashboardPaths.community) return pathname === dashboardPaths.community;
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <Sidebar side={direction === 'rtl' ? 'right' : 'left'} variant="sidebar" collapsible="offcanvas">
      <SidebarHeader className="px-4 py-5 border-b border-sidebar-border/50">
        <Link
          to={dashboardPaths.index}
          className="flex items-center gap-2.5 rounded-xl px-2 py-2 -mx-2 transition-colors hover:bg-sidebar-accent/80 active:scale-[0.98]"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
            <img
              src={LOGO_PATH}
              alt=""
              width={20}
              height={20}
              className="h-5 w-5 object-contain"
              decoding="async"
            />
          </div>
          <span className="text-base font-semibold tracking-tight text-sidebar-foreground">Shyftcut</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 px-2">
              {appNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    size="lg"
                    className="rounded-xl px-3 py-2.5 gap-3 data-[active=true]:bg-primary/15 data-[active=true]:text-primary data-[active=true]:font-medium data-[active=true]:shadow-sm data-[active=true]:ring-1 data-[active=true]:ring-primary/20 hover:bg-sidebar-accent/80"
                  >
                    <Link
                      to={item.href}
                      className="flex items-center gap-3"
                      onMouseEnter={() => prefetchRoute(item.href)}
                      onFocus={() => prefetchRoute(item.href)}
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      <span>{item.labelKey[language as keyof typeof item.labelKey]}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
            <div className="mt-4 px-2">
              <SidebarMenuButton asChild size="lg" className="w-full rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 hover:from-primary hover:to-primary/90 hover:shadow-primary/30 px-4 py-3 gap-3 font-medium">
                <Link
                  to="/wizard"
                  onMouseEnter={() => prefetchRoute('/wizard')}
                  onFocus={() => prefetchRoute('/wizard')}
                >
                  <IconMagicWand className="h-[18px] w-[18px] shrink-0" />
                  <span>{language === 'ar' ? 'إنشاء خريطة طريق' : 'Create roadmap'}</span>
                </Link>
              </SidebarMenuButton>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {user && (
        <SidebarFooter className="p-4 border-t border-sidebar-border/50 space-y-3">
          <SidebarMenu className="gap-1 px-2">
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === dashboardPaths.affiliate}
                size="lg"
                className="rounded-xl px-3 py-2.5 gap-3 data-[active=true]:bg-primary/15 data-[active=true]:text-primary"
              >
                <Link
                  to={dashboardPaths.affiliate}
                  className="flex items-center gap-3"
                  onMouseEnter={() => prefetchRoute(dashboardPaths.affiliate)}
                  onFocus={() => prefetchRoute(dashboardPaths.affiliate)}
                >
                  <IconGift className="h-[18px] w-[18px] shrink-0" />
                  <span>{t('affiliate.nav')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === dashboardPaths.profile}
                size="lg"
                className="rounded-xl px-3 py-2.5 gap-3 data-[active=true]:bg-primary/15 data-[active=true]:text-primary"
              >
                <Link
                  to={dashboardPaths.profile}
                  className="flex items-center gap-3"
                  onMouseEnter={() => prefetchRoute(dashboardPaths.profile)}
                  onFocus={() => prefetchRoute(dashboardPaths.profile)}
                >
                  <IconUser className="h-[18px] w-[18px] shrink-0" />
                  <span>{t('nav.profile')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleSignOut}
                size="lg"
                className="rounded-xl px-3 py-2.5 gap-3 text-destructive/90 hover:bg-destructive/10 hover:text-destructive"
              >
                <IconSignOut className="h-[18px] w-[18px] shrink-0" />
                <span>{t('nav.logout')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <nav className="flex flex-wrap gap-x-4 gap-y-1 px-3 py-2 text-[11px] text-sidebar-foreground/50" aria-label={language === 'ar' ? 'روابط' : 'Links'}>
            <Link to={dashboardPaths.support} className="hover:text-sidebar-foreground/80 transition-colors">{language === 'ar' ? 'الدعم' : 'Support'}</Link>
            <Link to="/contact" className="hover:text-sidebar-foreground/80 transition-colors">{language === 'ar' ? 'تواصل' : 'Contact'}</Link>
            <Link to="/terms" className="hover:text-sidebar-foreground/80 transition-colors">{language === 'ar' ? 'الشروط' : 'Terms'}</Link>
            <Link to="/privacy" className="hover:text-sidebar-foreground/80 transition-colors">{language === 'ar' ? 'الخصوصية' : 'Privacy'}</Link>
          </nav>
          <p className="px-3 text-[11px] text-sidebar-foreground/40">© {new Date().getFullYear()}</p>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
