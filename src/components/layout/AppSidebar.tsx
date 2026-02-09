import { Link, useLocation } from 'react-router-dom';
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
  IconUsers,
  IconBriefcase,
  IconLayoutDashboard,
  IconTarget,
  IconGraduationCap,
  IconTicket,
} from '@/lib/icons';
import { IconAICoach } from '@/components/common/IconAICoach';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { LOGO_PATH } from '@/lib/seo';
import { prefetchRoute } from '@/lib/route-prefetch';
import { dashboardPaths, isDashboardPath, studyPath, coursesPath } from '@/lib/dashboard-routes';
import { cn } from '@/lib/utils';

type NavItemConfig = {
  href: string;
  labelKey: { en: string; ar: string };
  icon: React.ComponentType<{ className?: string }>;
  activeClasses: string;
  inactiveClasses: string;
  iconActiveClasses: string;
  iconInactiveClasses: string;
};

const appNavItems: NavItemConfig[] = [
  { 
    href: dashboardPaths.index, 
    labelKey: { en: 'Dashboard', ar: 'لوحة التحكم' }, 
    icon: IconLayoutDashboard,
    activeClasses: 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-blue-400 font-semibold shadow-md shadow-blue-500/20 ring-1 ring-blue-500/30',
    inactiveClasses: 'hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-purple-500/20 text-sidebar-foreground/70',
    iconActiveClasses: 'text-blue-400',
    iconInactiveClasses: 'text-blue-500',
  },
  { 
    href: dashboardPaths.roadmap, 
    labelKey: { en: 'Roadmap', ar: 'خارطة الطريق' }, 
    icon: IconMapTrifold,
    activeClasses: 'bg-gradient-to-r from-emerald-500/30 to-teal-500/30 text-emerald-400 font-semibold shadow-md shadow-emerald-500/20 ring-1 ring-emerald-500/30',
    inactiveClasses: 'hover:bg-gradient-to-r hover:from-emerald-500/20 hover:to-teal-500/20 text-sidebar-foreground/70',
    iconActiveClasses: 'text-emerald-400',
    iconInactiveClasses: 'text-emerald-500',
  },
  { 
    href: dashboardPaths.study, 
    labelKey: { en: 'Focus', ar: 'التركيز' }, 
    icon: IconTarget,
    activeClasses: 'bg-gradient-to-r from-orange-500/30 to-amber-500/30 text-orange-400 font-semibold shadow-md shadow-orange-500/20 ring-1 ring-orange-500/30',
    inactiveClasses: 'hover:bg-gradient-to-r hover:from-orange-500/20 hover:to-amber-500/20 text-sidebar-foreground/70',
    iconActiveClasses: 'text-orange-400',
    iconInactiveClasses: 'text-orange-500',
  },
  { 
    href: dashboardPaths.courses, 
    labelKey: { en: 'Courses', ar: 'الدورات' }, 
    icon: IconGraduationCap,
    activeClasses: 'bg-gradient-to-r from-indigo-500/30 to-blue-500/30 text-indigo-400 font-semibold shadow-md shadow-indigo-500/20 ring-1 ring-indigo-500/30',
    inactiveClasses: 'hover:bg-gradient-to-r hover:from-indigo-500/20 hover:to-blue-500/20 text-sidebar-foreground/70',
    iconActiveClasses: 'text-indigo-400',
    iconInactiveClasses: 'text-indigo-500',
  },
  { 
    href: dashboardPaths.chat, 
    labelKey: { en: 'AI Coach', ar: 'المدرب الذكي' }, 
    icon: IconAICoach,
    activeClasses: 'bg-gradient-to-r from-pink-500/30 to-rose-500/30 text-pink-400 font-semibold shadow-md shadow-pink-500/20 ring-1 ring-pink-500/30',
    inactiveClasses: 'hover:bg-gradient-to-r hover:from-pink-500/20 hover:to-rose-500/20 text-sidebar-foreground/70',
    iconActiveClasses: 'text-pink-400',
    iconInactiveClasses: 'text-pink-500',
  },
  { 
    href: dashboardPaths.careerTools, 
    labelKey: { en: 'Career Tools', ar: 'أدوات مهنية' }, 
    icon: IconBriefcase,
    activeClasses: 'bg-gradient-to-r from-cyan-500/30 to-sky-500/30 text-cyan-400 font-semibold shadow-md shadow-cyan-500/20 ring-1 ring-cyan-500/30',
    inactiveClasses: 'hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-sky-500/20 text-sidebar-foreground/70',
    iconActiveClasses: 'text-cyan-400',
    iconInactiveClasses: 'text-cyan-500',
  },
  { 
    href: dashboardPaths.community, 
    labelKey: { en: 'Community', ar: 'المجتمع' }, 
    icon: IconUsers,
    activeClasses: 'bg-gradient-to-r from-violet-500/30 to-purple-500/30 text-violet-400 font-semibold shadow-md shadow-violet-500/20 ring-1 ring-violet-500/30',
    inactiveClasses: 'hover:bg-gradient-to-r hover:from-violet-500/20 hover:to-purple-500/20 text-sidebar-foreground/70',
    iconActiveClasses: 'text-violet-400',
    iconInactiveClasses: 'text-violet-500',
  },
  { 
    href: dashboardPaths.tickets, 
    labelKey: { en: 'Support', ar: 'الدعم' }, 
    icon: IconTicket,
    activeClasses: 'bg-gradient-to-r from-amber-500/30 to-yellow-500/30 text-amber-400 font-semibold shadow-md shadow-amber-500/20 ring-1 ring-amber-500/30',
    inactiveClasses: 'hover:bg-gradient-to-r hover:from-amber-500/20 hover:to-yellow-500/20 text-sidebar-foreground/70',
    iconActiveClasses: 'text-amber-400',
    iconInactiveClasses: 'text-amber-500',
  },
];

export function AppSidebar() {
  const { pathname } = useLocation();
  const { language, t, direction } = useLanguage();
  const { user } = useAuth();

  // When viewing a specific roadmap, Study and Courses links keep that roadmap in the URL
  const roadmapIdFromPath = pathname.startsWith(dashboardPaths.roadmap + '/')
    ? pathname.slice((dashboardPaths.roadmap + '/').length).split('/')[0]?.split('?')[0]
    : undefined;

  const getNavHref = (item: NavItemConfig) => {
    if (roadmapIdFromPath) {
      if (item.href === dashboardPaths.study) return studyPath(roadmapIdFromPath);
      if (item.href === dashboardPaths.courses) return coursesPath(roadmapIdFromPath);
    }
    return item.href;
  };

  const isActive = (href: string) => {
    if (href === dashboardPaths.index) return pathname === dashboardPaths.index;
    if (href === dashboardPaths.community) return pathname === dashboardPaths.community;
    return pathname.startsWith(href);
  };

  return (
    <Sidebar side={direction === 'rtl' ? 'right' : 'left'} variant="floating" collapsible="offcanvas">
      <SidebarHeader className="px-4 py-5 border-b border-sidebar-border/40 bg-gradient-to-b from-sidebar-accent/30 to-transparent">
        <Link
          to={dashboardPaths.index}
          className="flex items-center gap-3 rounded-xl px-2 py-2.5 -mx-2 transition-all hover:bg-sidebar-accent/60 active:scale-[0.98] group/logo"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 ring-1 ring-primary/30 overflow-hidden shadow-inner">
            <img src={LOGO_PATH} alt="" width={22} height={22} className="h-[22px] w-[22px] object-contain group-hover/logo:scale-105 transition-transform" decoding="async" />
          </div>
          <div className="min-w-0">
            <span className="text-base font-bold tracking-tight text-sidebar-foreground truncate block">Shyftcut</span>
            <span className="text-[10px] text-sidebar-foreground/50 uppercase tracking-wider">Dashboard</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="py-4 overflow-y-auto overflow-x-hidden flex-1 min-h-0">
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-sidebar to-transparent opacity-70 pointer-events-none z-10" aria-hidden />
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="gap-2 px-2">
                {appNavItems.map((item) => {
                  const href = getNavHref(item);
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        size="lg"
                        className={cn(
                          "rounded-xl px-3 py-2.5 gap-3 transition-all duration-200",
                          "hover:scale-[1.02]",
                          active ? item.activeClasses : item.inactiveClasses
                        )}
                      >
                        <Link
                          to={href}
                          className="flex items-center gap-3"
                          onMouseEnter={() => prefetchRoute(href)}
                          onFocus={() => prefetchRoute(href)}
                        >
                          <Icon className={cn("h-[18px] w-[18px] shrink-0 transition-colors", active ? item.iconActiveClasses : item.iconInactiveClasses)} />
                          <span>{item.labelKey[language as keyof typeof item.labelKey]}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-sidebar to-transparent opacity-70 pointer-events-none z-10" aria-hidden />
        </div>
      </SidebarContent>
      {user && (
        <SidebarFooter className="p-4 border-t border-sidebar-border/50 shrink-0">
          <nav className="flex flex-wrap gap-x-4 gap-y-1 px-3 py-2 text-[11px] text-sidebar-foreground/50" aria-label={language === 'ar' ? 'روابط' : 'Links'}>
            <Link to="/contact" className="hover:text-sidebar-foreground/80 transition-colors">{language === 'ar' ? 'تواصل' : 'Contact'}</Link>
            <Link to="/terms" className="hover:text-sidebar-foreground/80 transition-colors">{language === 'ar' ? 'الشروط' : 'Terms'}</Link>
            <Link to="/privacy" className="hover:text-sidebar-foreground/80 transition-colors">{language === 'ar' ? 'الخصوصية' : 'Privacy'}</Link>
            <Link to={dashboardPaths.affiliate} className="hover:text-sidebar-foreground/80 transition-colors">{t('affiliate.nav')}</Link>
          </nav>
          <p className="px-3 text-[11px] text-sidebar-foreground/40">© {new Date().getFullYear()}</p>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
