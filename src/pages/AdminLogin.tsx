import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, signIn } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    if (user && profile) {
      const profileRole = (profile as { role?: string })?.role;
      if (profileRole === 'superadmin') {
        navigate('/admin', { replace: true });
      } else {
        toast({
          title: language === 'ar' ? 'غير مصرح' : 'Unauthorized',
          description: language === 'ar' ? 'هذا الحساب ليس لديه صلاحيات المدير' : 'This account does not have admin privileges',
          variant: 'destructive',
        });
      }
    }
  }, [user, profile, navigate, toast, language]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(email, password);
      // Navigation will happen via useEffect when user/profile loads
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ في تسجيل الدخول' : 'Login Error',
        description: (error as Error).message || (language === 'ar' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Invalid email or password'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (user && profile) {
    const profileRole = (profile as { role?: string })?.role;
    if (profileRole === 'superadmin') {
      return (
        <div className="flex min-h-[100dvh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {language === 'ar' ? 'تسجيل دخول المدير' : 'Admin Login'}
          </CardTitle>
          <CardDescription>
            {language === 'ar' ? 'تسجيل الدخول إلى لوحة تحكم المدير' : 'Sign in to access the admin dashboard'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="admin-email" className="text-sm font-medium">
                {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
              </label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="admin-password" className="text-sm font-medium">
                {language === 'ar' ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Eye className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === 'ar' ? 'جاري تسجيل الدخول...' : 'Signing in...'}
                </>
              ) : (
                language === 'ar' ? 'تسجيل الدخول' : 'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              {language === 'ar' ? 'للمستخدمين العاديين' : 'Regular users'}{' '}
              <a href="/login" className="text-primary hover:underline">
                {language === 'ar' ? 'تسجيل الدخول هنا' : 'sign in here'}
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
