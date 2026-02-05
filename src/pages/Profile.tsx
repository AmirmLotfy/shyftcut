import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { User, Mail, Briefcase, Target, Globe, Loader2, Save, CreditCard, AlertCircle, Shield, Lock, Trash2, ImagePlus, Upload, Building2, Link2, Bell, Award, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { validatePassword } from '@/lib/password-validation';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useSubscription } from '@/hooks/useSubscription';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { useUserBadges } from '@/hooks/useUserBadges';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { useToast } from '@/hooks/use-toast';
import { apiFetch, apiPath, apiHeaders, extractApiErrorMessage } from '@/lib/api';
import { getUpgradePath } from '@/lib/upgrade-link';
import { debugError } from '@/lib/debug';
import { captureException } from '@/lib/error-tracking';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  industries,
  currentJobTitles,
  targetCareers,
  learningStyles,
  budgetOptions,
  experienceLevels,
} from '@/lib/profile-options';
import { COUNTRY_CODES, parsePhone, buildPhone } from '@/lib/country-codes';

export default function Profile() {
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const { user, session, signOut, getAccessToken } = useAuth();
  const queryClient = useQueryClient();
  const { profile, isLoading, error: profileError, updateProfile, isUpdating } = useProfile();
  const { tier, isPremium, periodEnd } = useSubscription();
  const { preferences: notifPrefs, updatePreferences: updateNotifPrefs, isUpdating: isUpdatingNotif } = useNotificationPreferences();
  const { badges: userBadges } = useUserBadges();
  const { subscribe: subscribePush, unsubscribe: unsubscribePush, subscribing: pushSubscribing, isSupported: pushSupported } = usePushSubscription();
  const { toast } = useToast();
  const [portalLoading, setPortalLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [setPasswordOpen, setSetPasswordOpen] = useState(false);
  const [setPasswordNew, setSetPasswordNew] = useState('');
  const [setPasswordConfirm, setSetPasswordConfirm] = useState('');
  const [setPasswordLoading, setSetPasswordLoading] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [changePasswordCurrent, setChangePasswordCurrent] = useState('');
  const [changePasswordNew, setChangePasswordNew] = useState('');
  const [changePasswordConfirm, setChangePasswordConfirm] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  const { data: authAccount } = useQuery({
    queryKey: ['auth-account', user?.id],
    queryFn: async () => {
      const token = await getAccessToken();
      return apiFetch<{ has_password?: boolean; has_google?: boolean }>('/api/auth/account', { token });
    },
    enabled: !!user && !!session,
  });
  const hasPassword = authAccount?.has_password ?? false;
  const hasGoogle = authAccount?.has_google ?? false;

  const [formData, setFormData] = useState({
    display_name: profile?.display_name ?? '',
    job_title: profile?.job_title ?? '',
    target_career: profile?.target_career ?? '',
    experience_level: profile?.experience_level ?? '',
    industry: (profile as { industry?: string })?.industry ?? '',
    skills: Array.isArray((profile as { skills?: string[] })?.skills)
      ? (profile as { skills: string[] }).skills.join(', ')
      : '',
    learning_style: (profile as { learning_style?: string })?.learning_style ?? '',
    weekly_hours: (profile as { weekly_hours?: number })?.weekly_hours ?? 10,
    budget: (profile as { budget?: string })?.budget ?? '',
    preferred_language: profile?.preferred_language ?? 'en',
    avatar_url: (profile as { avatar_url?: string })?.avatar_url ?? '',
    location: (profile as { location?: string })?.location ?? '',
    job_work_preference: (profile as { job_work_preference?: string })?.job_work_preference ?? '',
    find_jobs_enabled: (profile as { find_jobs_enabled?: boolean })?.find_jobs_enabled ?? false,
    linkedin_url: (profile as { linkedin_url?: string })?.linkedin_url ?? '',
    twitter_url: (profile as { twitter_url?: string })?.twitter_url ?? '',
    github_url: (profile as { github_url?: string })?.github_url ?? '',
    phone_country_code: '',
    phone_national: '',
  });
  const [avatarGenerating, setAvatarGenerating] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showAvatarUrl, setShowAvatarUrl] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast({
        title: t('common.errorTitle'),
        description: t('profile.useJpgOrPng'),
        variant: 'destructive',
      });
      e.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: t('common.errorTitle'),
        description: t('profile.maxSize2mb'),
        variant: 'destructive',
      });
      e.target.value = '';
      return;
    }
    setAvatarUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => {
          const dataUrl = r.result as string;
          const b = dataUrl.indexOf(',');
          resolve(b >= 0 ? dataUrl.slice(b + 1) : dataUrl);
        };
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const token = await getAccessToken();
      const data = await apiFetch<{ avatar_url?: string }>('/api/profile/avatar/upload', {
        method: 'POST',
        token,
        body: JSON.stringify({ image: base64, mime: file.type }),
      });
      if (data?.avatar_url) {
        setFormData((prev) => ({ ...prev, avatar_url: data.avatar_url! }));
        queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
        toast({
          title: t('profile.photoUploaded'),
          description: t('profile.avatarUpdated'),
        });
      }
    } catch (err: unknown) {
      toast({
        title: t('common.errorTitle'),
        description: err instanceof Error ? err.message : t('profile.uploadFailed'),
        variant: 'destructive',
      });
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  const handleGenerateAvatar = async () => {
    setAvatarGenerating(true);
    try {
      const token = await getAccessToken();
      const data = await apiFetch<{ avatar_url?: string }>('/api/profile/avatar/generate', {
        method: 'POST',
        token,
      });
      if (data?.avatar_url) {
        setFormData((prev) => ({ ...prev, avatar_url: data.avatar_url! }));
        queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
        toast({
          title: t('profile.avatarGenerated'),
          description: t('profile.avatarUpdated'),
        });
      }
    } catch (err: unknown) {
      toast({
        title: t('common.errorTitle'),
        description: err instanceof Error ? err.message : t('profile.avatarGenerateFailed'),
        variant: 'destructive',
      });
    } finally {
      setAvatarGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      display_name: formData.display_name.trim() || formData.display_name,
      skills: formData.skills
        ? formData.skills.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      location: formData.location?.trim() || null,
      job_work_preference: ['remote', 'hybrid', 'on_site'].includes(formData.job_work_preference) ? formData.job_work_preference : null,
      find_jobs_enabled: !!formData.find_jobs_enabled,
      linkedin_url: formData.linkedin_url?.trim() || null,
      twitter_url: formData.twitter_url?.trim() || null,
      github_url: formData.github_url?.trim() || null,
      phone: buildPhone(formData.phone_country_code, formData.phone_national) || null,
    };
    updateProfile(payload, {
      onSuccess: () => {
        toast({
          title: t('common.saved'),
          description: t('profile.profileUpdated'),
        });
        if (payload.preferred_language !== language) {
          setLanguage(payload.preferred_language as 'en' | 'ar');
        }
      },
      onError: () => {
        toast({
          title: t('common.errorTitle'),
          description: t('profile.saveFailed'),
          variant: 'destructive',
        });
      },
    });
  };

  // Sync form when profile loads or changes
  useEffect(() => {
    if (profile) {
      const p = profile as Record<string, unknown>;
      setFormData({
        display_name: (p.display_name as string) ?? '',
        job_title: (p.job_title as string) ?? '',
        target_career: (p.target_career as string) ?? '',
        experience_level: (p.experience_level as string) ?? '',
        industry: (p.industry as string) ?? '',
        skills: Array.isArray(p.skills) ? (p.skills as string[]).join(', ') : '',
        learning_style: (p.learning_style as string) ?? '',
        weekly_hours: typeof p.weekly_hours === 'number' ? p.weekly_hours : 10,
        budget: (p.budget as string) ?? '',
        preferred_language: (p.preferred_language as string) ?? 'en',
        avatar_url: (p.avatar_url as string) ?? '',
        location: (p.location as string) ?? '',
        job_work_preference: (p.job_work_preference as string) ?? '',
        find_jobs_enabled: !!(p.find_jobs_enabled as boolean),
        linkedin_url: (p.linkedin_url as string) ?? '',
        twitter_url: (p.twitter_url as string) ?? '',
        github_url: (p.github_url as string) ?? '',
        phone_country_code: parsePhone(p.phone as string | undefined).countryCode,
        phone_national: parsePhone(p.phone as string | undefined).nationalNumber,
      });
    }
  }, [profile]);

  const signInMethodLabel =
    hasPassword && hasGoogle
      ? t('profile.authMethodEmailGoogle')
      : hasGoogle
        ? t('profile.authMethodGoogle')
        : t('profile.authMethodEmail');

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (setPasswordNew !== setPasswordConfirm) {
      toast({
        title: t('common.errorTitle'),
        description: t('profile.passwordsDontMatch'),
        variant: 'destructive',
      });
      return;
    }
    const passwordValidation = validatePassword(setPasswordNew);
    if (!passwordValidation.valid) {
      toast({
        title: t('auth.passwordWeak'),
        description: passwordValidation.message ? t(passwordValidation.message) : undefined,
        variant: 'destructive',
      });
      return;
    }
    setSetPasswordLoading(true);
    try {
      const token = await getAccessToken();
      await apiFetch('/api/auth/set-password', {
        method: 'POST',
        token,
        body: JSON.stringify({ newPassword: setPasswordNew }),
      });
      toast({
        title: t('profile.passwordSet'),
        description: t('profile.passwordSetDescription'),
      });
      setSetPasswordOpen(false);
      setSetPasswordNew('');
      setSetPasswordConfirm('');
    } catch (err: unknown) {
      debugError('Profile', 'set-password failed', err);
      captureException(err);
      toast({
        title: t('common.errorTitle'),
        description: (err as Error)?.message ?? t('profile.setPasswordFailed'),
        variant: 'destructive',
      });
    } finally {
      setSetPasswordLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (changePasswordNew !== changePasswordConfirm) {
      toast({
        title: t('common.errorTitle'),
        description: t('profile.newPasswordsDontMatch'),
        variant: 'destructive',
      });
      return;
    }
    const passwordValidation = validatePassword(changePasswordNew);
    if (!passwordValidation.valid) {
      toast({
        title: t('auth.passwordWeak'),
        description: passwordValidation.message ? t(passwordValidation.message) : undefined,
        variant: 'destructive',
      });
      return;
    }
    setChangePasswordLoading(true);
    try {
      const token = await getAccessToken();
      await apiFetch('/api/auth/change-password', {
        method: 'POST',
        token,
        body: JSON.stringify({
          currentPassword: changePasswordCurrent,
          newPassword: changePasswordNew,
        }),
      });
      toast({
        title: t('profile.passwordChanged'),
        description: t('profile.passwordUpdated'),
      });
      setChangePasswordOpen(false);
      setChangePasswordCurrent('');
      setChangePasswordNew('');
      setChangePasswordConfirm('');
    } catch (err: unknown) {
      debugError('Profile', 'change-password failed', err);
      captureException(err);
      toast({
        title: t('common.errorTitle'),
        description: (err as Error)?.message ?? t('profile.changePasswordFailed'),
        variant: 'destructive',
      });
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const isPasswordAccount = hasPassword;
    if (isPasswordAccount && !deletePassword) {
      toast({
        title: t('common.errorTitle'),
        description: t('profile.enterPasswordToConfirm'),
        variant: 'destructive',
      });
      return;
    }
    if (!isPasswordAccount && deleteConfirmText !== 'DELETE') {
      toast({
        title: t('common.errorTitle'),
        description: t('profile.typeDeleteToConfirm'),
        variant: 'destructive',
      });
      return;
    }
    setDeleteLoading(true);
    try {
      const token = await getAccessToken();
      const res = await fetch(apiPath('/api/auth/account'), {
        method: 'DELETE',
        headers: apiHeaders('/api/auth/account', token),
        body: JSON.stringify(
          isPasswordAccount ? { password: deletePassword } : { confirm: deleteConfirmText }
        ),
      });
      if (!res.ok) {
        const raw = await res.text();
        let data: Record<string, unknown> = {};
        try {
          if (raw.trim()) data = JSON.parse(raw) as Record<string, unknown>;
        } catch { /* ignore */ }
        throw new Error(extractApiErrorMessage(data, res.statusText));
      }
      setDeleteDialogOpen(false);
      setDeletePassword('');
      setDeleteConfirmText('');
      signOut();
      navigate('/', { replace: true });
    } catch (err: unknown) {
      debugError('Profile', 'delete account failed', err);
      captureException(err);
      toast({
        title: t('common.errorTitle'),
        description: (err as Error)?.message ?? t('profile.deleteAccountFailed'),
        variant: 'destructive',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto max-w-app-content px-4 pb-24 pt-6 sm:px-6 sm:py-8">
          <Skeleton className="mb-6 h-9 w-48" />
          <Skeleton className="mb-8 h-5 w-64" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <Skeleton className="h-48 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </div>
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (profileError) {
    return (
      <Layout>
        <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-md text-center"
          >
            <div className="mb-4 flex justify-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">
              {t('profile.somethingWrong')}
            </h2>
            <p className="mb-6 text-muted-foreground">
              {(profileError as Error)?.message || t('profile.couldNotLoad')}
            </p>
            <Button asChild>
              <Link to="/dashboard">{t('profile.backToDashboard')}</Link>
            </Button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-app-content px-4 pb-24 pt-6 sm:px-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="mb-2 text-2xl font-bold sm:text-3xl">
            {t('profile.profileSettings')}
          </h1>
          <p className="text-muted-foreground">
            {t('profile.manageInfo')}
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="public-glass-card rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t('profile.personalInfo')}
                </CardTitle>
                <CardDescription>
                  {t('profile.updateBasicDetails')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form data-testid="profile-form" onSubmit={handleSubmit} className="space-y-4">
                  {/* Avatar: Upload (primary), Generate (paid), URL (optional) */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="flex items-center gap-4">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-border bg-muted">
                        {formData.avatar_url ? (
                          <img src={formData.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <User className="h-10 w-10 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-wrap items-center gap-2 min-w-0">
                        <input
                          ref={avatarFileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="sr-only"
                          disabled={avatarUploading}
                          onChange={handleUploadAvatar}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={avatarUploading}
                          className="gap-2"
                          onClick={() => avatarFileInputRef.current?.click()}
                        >
                          {avatarUploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                            {t('profile.uploadPhoto')}
                        </Button>
                        {isPremium && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={avatarGenerating}
                            onClick={handleGenerateAvatar}
                            className="gap-2 shrink-0"
                          >
                            {avatarGenerating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ImagePlus className="h-4 w-4" />
                            )}
                            {t('profile.generateWithAi')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  <Collapsible open={showAvatarUrl} onOpenChange={setShowAvatarUrl}>
                    <CollapsibleTrigger asChild>
                      <Button type="button" variant="ghost" size="sm" className="text-muted-foreground">
                        {showAvatarUrl ? t('profile.hideImageUrl') : t('profile.orPasteUrl')}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 space-y-2">
                        <Label htmlFor="avatar_url">
                          {t('profile.imageUrl')}
                        </Label>
                        <Input
                          id="avatar_url"
                          type="url"
                          value={formData.avatar_url}
                          onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                          placeholder="https://..."
                          className="min-w-0"
                        />
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="display_name">
                        {t('profile.displayName')}
                      </Label>
                      <Input
                        id="display_name"
                        value={formData.display_name}
                        onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                        placeholder={t('profile.yourName')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        {t('profile.email')}
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" />
                        <Input
                          id="email"
                          value={user?.email || ''}
                          disabled
                          className="pl-10 opacity-60 rtl:pl-0 rtl:pr-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        {t('profile.phone')}
                      </Label>
                      <div className="flex gap-2">
                        <Select
                          value={formData.phone_country_code || '+1'}
                          onValueChange={(v) => setFormData({ ...formData, phone_country_code: v })}
                        >
                          <SelectTrigger className="w-[130px] shrink-0">
                            <Phone className="ml-2 h-4 w-4 text-muted-foreground rtl:ml-0 rtl:mr-2" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COUNTRY_CODES.map((c) => (
                              <SelectItem key={c.code} value={c.dial}>
                                {c.dial} {c.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          id="phone"
                          type="tel"
                          inputMode="numeric"
                          value={formData.phone_national}
                          onChange={(e) => setFormData({ ...formData, phone_national: e.target.value.replace(/\D/g, '') })}
                          placeholder={t('profile.phonePlaceholder')}
                          className="min-w-0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{t('profile.currentJobTitle')}</Label>
                      <Select
                        value={formData.job_title || '_none'}
                        onValueChange={(v) => setFormData({ ...formData, job_title: v === '_none' ? '' : v })}
                      >
                        <SelectTrigger>
                          <Briefcase className="ml-2 h-4 w-4 text-muted-foreground rtl:ml-0 rtl:mr-2" />
                          <SelectValue placeholder={t('profile.selectJobTitle')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">{t('profile.none')}</SelectItem>
                          {currentJobTitles.map((title) => (
                            <SelectItem key={title} value={title}>{title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('profile.targetCareer')}</Label>
                      <Select
                        value={formData.target_career || '_none'}
                        onValueChange={(v) => setFormData({ ...formData, target_career: v === '_none' ? '' : v })}
                      >
                        <SelectTrigger>
                          <Target className="ml-2 h-4 w-4 text-muted-foreground rtl:ml-0 rtl:mr-2" />
                          <SelectValue placeholder={t('profile.selectTargetCareer')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">{t('profile.none')}</SelectItem>
                          {targetCareers.map((career) => (
                            <SelectItem key={career} value={career}>{career}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{t('profile.industry')}</Label>
                      <Select
                        value={formData.industry || '_none'}
                        onValueChange={(v) => setFormData({ ...formData, industry: v === '_none' ? '' : v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('profile.selectIndustry')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">{t('profile.none')}</SelectItem>
                          {industries.map((ind) => (
                            <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="skills">
                        {t('profile.skillsComma')}
                      </Label>
                      <Input
                        id="skills"
                        value={formData.skills}
                        onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                        placeholder={t('profile.skillsPlaceholder')}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{t('profile.experienceLevel')}</Label>
                      <Select
                        value={formData.experience_level || '_none'}
                        onValueChange={(v) => setFormData({ ...formData, experience_level: v === '_none' ? '' : v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('profile.selectLevel')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">{t('profile.none')}</SelectItem>
                          {experienceLevels.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level === 'entry' ? 'Entry' : level === 'junior' ? 'Junior' : level === 'mid' ? 'Mid-Level' : level === 'senior' ? 'Senior' : 'Executive'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('profile.weeklyLearningHours')}</Label>
                      <Input
                        type="number"
                        min={1}
                        max={40}
                        value={formData.weekly_hours}
                        onChange={(e) => setFormData({ ...formData, weekly_hours: Math.min(40, Math.max(1, Number(e.target.value) || 10)) })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{t('profile.learningStyle')}</Label>
                      <Select
                        value={formData.learning_style || '_none'}
                        onValueChange={(v) => setFormData({ ...formData, learning_style: v === '_none' ? '' : v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('profile.selectStyle')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">{t('profile.none')}</SelectItem>
                          {learningStyles.map((style) => (
                            <SelectItem key={style} value={style}>
                              {style === 'video' ? 'Video' : style === 'reading' ? 'Reading' : style === 'hands-on' ? 'Hands-on' : 'Mixed'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('profile.budget')}</Label>
                      <Select
                        value={formData.budget || '_none'}
                        onValueChange={(v) => setFormData({ ...formData, budget: v === '_none' ? '' : v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('profile.selectBudget')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">{t('profile.none')}</SelectItem>
                          {budgetOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option === 'free' ? t('profile.freeOnly') : option === 'up_to_50' ? t('profile.upTo50') : option === 'up_to_200' ? t('profile.upTo200') : t('profile.unlimited')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{t('profile.preferredLanguageLabel')}</Label>
                      <Select
                        value={formData.preferred_language}
                        onValueChange={(v) => setFormData({ ...formData, preferred_language: v })}
                      >
                        <SelectTrigger>
                          <Globe className="mr-2 h-4 w-4 rtl:mr-0 rtl:ml-2" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="ar">العربية</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">
                        {t('profile.location')}
                      </Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder={t('profile.locationPlaceholder')}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{t('profile.workType')}</Label>
                      <Select
                        value={formData.job_work_preference || '_none'}
                        onValueChange={(v) => setFormData({ ...formData, job_work_preference: v === '_none' ? '' : v })}
                      >
                        <SelectTrigger>
                          <Building2 className="ml-2 h-4 w-4 text-muted-foreground rtl:ml-0 rtl:mr-2" />
                          <SelectValue placeholder={language === 'ar' ? 'اختر نوع العمل' : 'Select work type'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">{t('profile.none')}</SelectItem>
                          <SelectItem value="remote">{t('profile.remote')}</SelectItem>
                          <SelectItem value="hybrid">{t('profile.hybrid')}</SelectItem>
                          <SelectItem value="on_site">{t('profile.onSite')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {isPremium && (
                      <div className="space-y-2 flex items-center gap-4">
                        <Switch
                          id="find_jobs_enabled"
                          checked={formData.find_jobs_enabled}
                          onCheckedChange={(checked) => setFormData({ ...formData, find_jobs_enabled: checked })}
                        />
                        <Label htmlFor="find_jobs_enabled" className="cursor-pointer">
                          {t('profile.findJobsWeekly')}
                        </Label>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm font-medium">{t('profile.socialLinks')}</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">{t('profile.socialLinksDescription')}</p>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="linkedin_url">{t('profile.linkedin')}</Label>
                        <Input
                          id="linkedin_url"
                          type="url"
                          value={formData.linkedin_url}
                          onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                          placeholder={t('profile.linkedinPlaceholder')}
                          className="min-w-0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="twitter_url">{t('profile.twitter')}</Label>
                        <Input
                          id="twitter_url"
                          type="url"
                          value={formData.twitter_url}
                          onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                          placeholder={t('profile.twitterPlaceholder')}
                          className="min-w-0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="github_url">{t('profile.github')}</Label>
                        <Input
                          id="github_url"
                          type="url"
                          value={formData.github_url}
                          onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                          placeholder={t('profile.githubPlaceholder')}
                          className="min-w-0"
                        />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" disabled={isUpdating} className="btn-glow gap-2">
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {t('profile.saveChanges')}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Study reminders */}
            <Card className="mt-6 public-glass-card rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  {t('profile.notificationPreferences')}
                </CardTitle>
                <CardDescription>
                  {t('profile.notificationPreferencesDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="email_reminders" className="cursor-pointer">{t('profile.emailReminders')}</Label>
                    <p className="text-xs text-muted-foreground">{t('profile.emailRemindersDescription')}</p>
                  </div>
                  <Switch
                    id="email_reminders"
                    checked={notifPrefs?.email_reminders ?? true}
                    onCheckedChange={(checked) => updateNotifPrefs({ email_reminders: checked })}
                    disabled={isUpdatingNotif}
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="in_app_reminder" className="cursor-pointer">{t('profile.inAppReminder')}</Label>
                    <p className="text-xs text-muted-foreground">{t('profile.inAppReminderDescription')}</p>
                  </div>
                  <Switch
                    id="in_app_reminder"
                    checked={notifPrefs?.in_app_reminder ?? true}
                    onCheckedChange={(checked) => updateNotifPrefs({ in_app_reminder: checked })}
                    disabled={isUpdatingNotif}
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="push_enabled" className="cursor-pointer">{language === 'ar' ? 'إشعارات الدفع' : 'Push notifications'}</Label>
                    <p className="text-xs text-muted-foreground">
                      {language === 'ar' ? 'استقبل تذكيراً حتى عند إغلاق التبويب (يتطلب HTTPS)' : 'Get a reminder even when the tab is closed (requires HTTPS)'}
                    </p>
                  </div>
                  <Switch
                    id="push_enabled"
                    checked={notifPrefs?.push_enabled ?? false}
                    disabled={!pushSupported || isUpdatingNotif || pushSubscribing}
                    onCheckedChange={async (checked) => {
                      if (checked) {
                        const result = await subscribePush();
                        if (result.ok) {
                          updateNotifPrefs({ push_enabled: true });
                          toast({ title: language === 'ar' ? 'تم تفعيل الإشعارات' : 'Push enabled' });
                        } else {
                          toast({ title: result.error ?? 'Failed', variant: 'destructive' });
                        }
                      } else {
                        await unsubscribePush();
                        updateNotifPrefs({ push_enabled: false });
                      }
                    }}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="reminder_time">{t('profile.reminderTime')}</Label>
                    <Input
                      id="reminder_time"
                      type="time"
                      value={notifPrefs?.reminder_time?.slice(0, 5) ?? '20:00'}
                      onChange={(e) => updateNotifPrefs({ reminder_time: e.target.value || '20:00' })}
                      disabled={isUpdatingNotif}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">{t('profile.timezone')}</Label>
                    <Input
                      id="timezone"
                      value={notifPrefs?.timezone ?? 'UTC'}
                      onChange={(e) => updateNotifPrefs({ timezone: e.target.value.trim() || 'UTC' })}
                      placeholder="UTC"
                      disabled={isUpdatingNotif}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Badges */}
            <Card className="mt-6 public-glass-card rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  {language === 'ar' ? 'الشارات' : 'Badges'}
                </CardTitle>
                <CardDescription>
                  {language === 'ar' ? 'الشارات التي حصلت عليها من الدراسة والمجموعات' : 'Badges you\'ve earned from studying and community'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {userBadges.length === 0 && (
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'لا توجد شارات بعد. أكمل أسابيع وامتدادات لفتحها.' : 'No badges yet. Complete weeks and streaks to unlock them.'}</p>
                  )}
                  {userBadges.map((b) => (
                    <Badge key={b.badge_id} variant="secondary" className="gap-1 py-1.5 px-2.5" title={b.description ?? undefined}>
                      <Award className="h-3 w-3" />
                      {b.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Account & security */}
            <Card className="mt-6 public-glass-card rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {t('profile.accountSecurity')}
                </CardTitle>
                <CardDescription>
                  {t('profile.accountSecurityDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-muted-foreground">
                    {t('profile.signInMethod')}
                  </Label>
                  <p className="mt-1 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    {t('profile.signedInWith')}{' '}
                    <Badge variant="secondary">{signInMethodLabel}</Badge>
                  </p>
                </div>

                {hasGoogle && !hasPassword && (
                  <div>
                    <Label className="text-muted-foreground">
                      {t('profile.password')}
                    </Label>
                    <p className="mt-1 mb-2 text-sm text-muted-foreground">
                      {t('profile.setPasswordToSignIn')}
                    </p>
                    {!setPasswordOpen ? (
                      <Button type="button" variant="outline" size="sm" onClick={() => setSetPasswordOpen(true)}>
                        {t('profile.setPassword')}
                      </Button>
                    ) : (
                      <form onSubmit={handleSetPassword} className="mt-2 space-y-3 max-w-xs">
                        <Input
                          type="password"
                          placeholder={t('profile.newPassword')}
                          value={setPasswordNew}
                          onChange={(e) => setSetPasswordNew(e.target.value)}
                          minLength={6}
                          required
                        />
                        <Input
                          type="password"
                          placeholder={t('profile.confirmPassword')}
                          value={setPasswordConfirm}
                          onChange={(e) => setSetPasswordConfirm(e.target.value)}
                          minLength={6}
                          required
                        />
                        <div className="flex gap-2">
                          <Button type="submit" disabled={setPasswordLoading} size="sm">
                            {setPasswordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.save')}
                          </Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => { setSetPasswordOpen(false); setSetPasswordNew(''); setSetPasswordConfirm(''); }}>
                            {t('common.cancel')}
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {hasPassword && (
                  <div>
                    <Label className="text-muted-foreground">
                      {t('profile.changePassword')}
                    </Label>
                    {!changePasswordOpen ? (
                      <Button type="button" variant="outline" size="sm" className="mt-1" onClick={() => setChangePasswordOpen(true)}>
                        {t('profile.changePassword')}
                      </Button>
                    ) : (
                      <form onSubmit={handleChangePassword} className="mt-2 space-y-3 max-w-xs">
                        <Input
                          type="password"
                          placeholder={t('profile.currentPassword')}
                          value={changePasswordCurrent}
                          onChange={(e) => setChangePasswordCurrent(e.target.value)}
                          required
                        />
                        <Input
                          type="password"
                          placeholder={t('profile.newPassword')}
                          value={changePasswordNew}
                          onChange={(e) => setChangePasswordNew(e.target.value)}
                          minLength={6}
                          required
                        />
                        <Input
                          type="password"
                          placeholder={t('profile.confirmNewPassword')}
                          value={changePasswordConfirm}
                          onChange={(e) => setChangePasswordConfirm(e.target.value)}
                          minLength={6}
                          required
                        />
                        <div className="flex gap-2">
                          <Button type="submit" disabled={changePasswordLoading} size="sm">
                            {changePasswordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.save')}
                          </Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => { setChangePasswordOpen(false); setChangePasswordCurrent(''); setChangePasswordNew(''); setChangePasswordConfirm(''); }}>
                            {t('common.cancel')}
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                <div className="border-t border-border pt-6">
                  <Label className="text-destructive">
                    {t('profile.dangerZone')}
                  </Label>
                  <p className="mt-1 mb-2 text-sm text-muted-foreground">
                    {t('profile.deleteAccountDescription')}
                  </p>
                  <Button type="button" variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
                    <Trash2 className="mr-2 h-4 w-4 rtl:mr-0 rtl:ml-2" />
                    {t('profile.deleteAccount')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Subscription Card */}
            <Card className="public-glass-card rounded-2xl">
              <CardHeader>
                <CardTitle>{t('profile.subscription')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {t('profile.currentPlan')}
                  </span>
                  <Badge className="capitalize">{tier}</Badge>
                </div>
                {isPremium && periodEnd && (
                  <p className="mb-4 text-sm text-muted-foreground">
                    {language === 'ar'
                      ? `تجديد في ${new Date(periodEnd).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}`
                      : `Renews on ${new Date(periodEnd).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}`}
                  </p>
                )}
                <div className="flex flex-col gap-2">
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/upgrade?returnTo=/profile" state={{ returnTo: '/profile' }}>
                      {t('profile.viewPlans')}
                    </Link>
                  </Button>
                  {isPremium && (
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      disabled={portalLoading}
                      onClick={async () => {
                        const token = await getAccessToken();
                        if (!token) return;
                        setPortalLoading(true);
                        try {
                          const data = await apiFetch<{ url?: string }>(
                            `/api/checkout/portal?returnUrl=${encodeURIComponent(window.location.href)}`,
                            { token, skipUnauthorizedLogout: true }
                          );
                          if (data?.url) window.location.href = data.url;
                          else throw new Error('No portal URL');
                        } catch (err) {
                          debugError('Profile', 'checkout portal failed', err);
                          captureException(err);
                          toast({
                            title: t('common.errorTitle'),
                            description: err instanceof Error ? err.message : t('profile.couldNotOpenSubscription'),
                            variant: 'destructive',
                          });
                        } finally {
                          setPortalLoading(false);
                        }
                      }}
                    >
                      {portalLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CreditCard className="h-4 w-4" />
                      )}
                      {t('profile.manageSubscription')}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Skills Card */}
            {profile?.skills && profile.skills.length > 0 && (
              <Card className="public-glass-card rounded-2xl">
                <CardHeader>
                  <CardTitle>{t('profile.skills')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill: string, i: number) => (
                      <Badge key={i} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>

      {/* Delete account confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('profile.deleteAccount')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {hasPassword
                ? t('profile.enterPasswordDelete')
                : t('profile.typeDeleteBelow')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {hasPassword ? (
            <div className="py-2">
              <Label htmlFor="delete-password">{t('profile.password')}</Label>
              <Input
                id="delete-password"
                type="password"
                className="mt-2"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder={t('profile.yourPassword')}
              />
            </div>
          ) : (
            <div className="py-2">
              <Label htmlFor="delete-confirm">{t('profile.typeDelete')}</Label>
              <Input
                id="delete-confirm"
                type="text"
                className="mt-2 font-mono"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deleteLoading}
              onClick={() => handleDeleteAccount()}
            >
              {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('profile.deleteAccount')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
