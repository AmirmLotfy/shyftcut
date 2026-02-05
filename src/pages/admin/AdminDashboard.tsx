import { useState } from 'react';
import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { Users, CreditCard, BarChart3, FileText, Settings, Shield, LogOut, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Users as UsersPage } from './Users';
import { Subscriptions } from './Subscriptions';
import { Analytics } from './Analytics';
import { Content } from './Content';
import { Settings as SettingsPage } from './Settings';
import { AuditLog } from './AuditLog';

const adminNavItems = [
  { href: '/admin/users', label: { en: 'Users', ar: 'المستخدمون' }, icon: Users },
  { href: '/admin/subscriptions', label: { en: 'Subscriptions', ar: 'الاشتراكات' }, icon: CreditCard },
  { href: '/admin/analytics', label: { en: 'Analytics', ar: 'التحليلات' }, icon: BarChart3 },
  { href: '/admin/content', label: { en: 'Content', ar: 'المحتوى' }, icon: FileText },
  { href: '/admin/settings', label: { en: 'Settings', ar: 'الإعدادات' }, icon: Settings },
  { href: '/admin/audit-log', label: { en: 'Audit Log', ar: 'سجل التدقيق' }, icon: Shield },
];

const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => {
  const location = useLocation();
  const { signOut } = useAuth();
  const { language } = useLanguage();

  return (
    <>
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Shyftcut</p>
      </div>
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors min-h-[44px]',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.label[language as 'en' | 'ar']}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 min-h-[44px]"
          onClick={() => {
            signOut();
            window.location.href = '/dashboard';
          }}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span>{language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}</span>
        </Button>
      </div>
    </>
  );
};

export default function AdminDashboard() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isMobile) {
    return (
      <div className="flex h-screen flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SidebarContent onNavigate={() => setSidebarOpen(false)} />
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-bold">Admin</h1>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-background">
          <Routes>
            <Route index element={<Navigate to="/admin/users" replace />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="content" element={<Content />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="audit-log" element={<AuditLog />} />
          </Routes>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-border bg-card flex-shrink-0 flex-col">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background">
        <Routes>
          <Route index element={<Navigate to="/admin/users" replace />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="content" element={<Content />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="audit-log" element={<AuditLog />} />
        </Routes>
      </main>
    </div>
  );
}
