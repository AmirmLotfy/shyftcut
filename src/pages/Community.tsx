import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, Trophy, Flame, Loader2, Link2, Crown, UserPlus, LogOut, PlusCircle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useUserBadges } from '@/hooks/useUserBadges';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';
import { PremiumGateCard } from '@/components/common/PremiumGateCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { targetCareers, experienceLevels } from '@/lib/profile-options';

interface Peer {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
  target_career: string | null;
  experience_level: string | null;
  linkedin_url: string | null;
  current_streak: number;
  longest_streak: number;
  connected: boolean;
}

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
}

interface StudyGroup {
  id: string;
  name: string;
  description: string | null;
  roadmap_id: string | null;
  target_career: string | null;
  experience_level: string | null;
  created_by_user_id: string;
  created_at: string;
  creator_name: string | null;
  creator_avatar: string | null;
  member_count: number;
  is_member: boolean;
}

interface GroupStreakEntry {
  id: string;
  name: string;
  member_count: number;
  group_streak: number;
}

interface GroupMember {
  user_id: string;
  role: string;
  joined_at: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface BadgeDiscovery {
  id: string;
  name: string;
  description: string | null;
  criteria: string | null;
}

export default function Community() {
  const { t, language } = useLanguage();
  const { user, getAccessToken } = useAuth();
  const { toast } = useToast();
  const { isPremium } = useSubscription();
  const { badges: userBadges } = useUserBadges();
  const queryClient = useQueryClient();
  const [targetCareer, setTargetCareer] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [groupTargetCareer, setGroupTargetCareer] = useState('');
  const [groupExperienceLevel, setGroupExperienceLevel] = useState('');
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [chatGroupId, setChatGroupId] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [membersGroupId, setMembersGroupId] = useState<string | null>(null);
  const [membersGroupName, setMembersGroupName] = useState('');
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'all' | 'week' | 'month'>('all');

  const { data: peers = [], isLoading: peersLoading } = useQuery({
    queryKey: ['community-peers', user?.id, targetCareer, experienceLevel],
    queryFn: async (): Promise<Peer[]> => {
      const token = await getAccessToken();
      const params = new URLSearchParams();
      if (targetCareer) params.set('target_career', targetCareer);
      if (experienceLevel) params.set('experience_level', experienceLevel);
      const q = params.toString() ? `?${params.toString()}` : '';
      return apiFetch<Peer[]>(`/api/community/peers${q}`, { token });
    },
    enabled: !!user && isPremium,
  });

  const { data: leaderboard = [], isLoading: leaderboardLoading } = useQuery({
    queryKey: ['community-leaderboard', user?.id, leaderboardPeriod],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const token = await getAccessToken();
      return apiFetch<LeaderboardEntry[]>(`/api/community/leaderboard?period=${leaderboardPeriod}&limit=20`, { token });
    },
    enabled: !!user && isPremium,
  });

  const connectMutation = useMutation({
    mutationFn: async ({ targetUserId, connect }: { targetUserId: string; connect: boolean }) => {
      const token = await getAccessToken();
      if (connect) {
        return apiFetch('/api/community/connections', {
          method: 'POST',
          token,
          body: JSON.stringify({ target_user_id: targetUserId }),
        });
      }
      return apiFetch('/api/community/connections', {
        method: 'DELETE',
        token,
        body: JSON.stringify({ target_user_id: targetUserId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-peers'] });
    },
  });

  const { data: allBadges = [], isLoading: badgesLoading } = useQuery({
    queryKey: ['community-badges', user?.id],
    queryFn: async (): Promise<BadgeDiscovery[]> => {
      const token = await getAccessToken();
      return apiFetch<BadgeDiscovery[]>('/api/community/badges', { token });
    },
    enabled: !!user && isPremium,
  });

  const earnedBadgeIds = new Set(userBadges.map((b) => b.badge_id));

  const { data: topGroupsByStreak = [], isLoading: topGroupsLoading } = useQuery({
    queryKey: ['community-groups-top-by-streak', user?.id],
    queryFn: async (): Promise<GroupStreakEntry[]> => {
      const token = await getAccessToken();
      return apiFetch<GroupStreakEntry[]>('/api/community/groups/top-by-streak?limit=10', { token });
    },
    enabled: !!user && isPremium,
  });

  const { data: studyGroups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['community-groups', user?.id, groupTargetCareer, groupExperienceLevel],
    queryFn: async (): Promise<StudyGroup[]> => {
      const token = await getAccessToken();
      const params = new URLSearchParams();
      if (groupTargetCareer) params.set('target_career', groupTargetCareer);
      if (groupExperienceLevel) params.set('experience_level', groupExperienceLevel);
      const q = params.toString() ? `?${params.toString()}` : '';
      return apiFetch<StudyGroup[]>(`/api/community/groups${q}`, { token });
    },
    enabled: !!user && isPremium,
  });

  const createGroupMutation = useMutation({
    mutationFn: async (payload: { name: string; description?: string; target_career?: string; experience_level?: string }) => {
      const token = await getAccessToken();
      return apiFetch('/api/community/groups', {
        method: 'POST',
        token,
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-groups'] });
      queryClient.invalidateQueries({ queryKey: ['community-groups-top-by-streak'] });
      setCreateGroupOpen(false);
      setNewGroupName('');
      setNewGroupDescription('');
    },
    onError: (err) => {
      toast({
        title: t('auth.community.groupBlocked'),
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: async ({ groupId, join }: { groupId: string; join: boolean }) => {
      const token = await getAccessToken();
      if (join) {
        return apiFetch(`/api/community/groups/${groupId}/join`, { method: 'POST', token });
      }
      return apiFetch(`/api/community/groups/${groupId}/leave`, { method: 'DELETE', token });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-groups'] });
      queryClient.invalidateQueries({ queryKey: ['community-groups-top-by-streak'] });
    },
  });

  const { data: chatRoom, isLoading: chatRoomLoading } = useQuery({
    queryKey: ['community-chat-room', chatGroupId, user?.id],
    queryFn: async (): Promise<{ room_id: string }> => {
      const token = await getAccessToken();
      const res = await apiFetch<{ room_id: string }>(`/api/community/chat/room/${chatGroupId}`, { token });
      if (!res?.room_id) throw new Error('No room');
      return res;
    },
    enabled: !!user && isPremium && !!chatGroupId,
  });

  const { data: chatMessages = [], isLoading: chatMessagesLoading, refetch: refetchChatMessages } = useQuery({
    queryKey: ['community-chat-messages', chatRoom?.room_id, user?.id],
    queryFn: async (): Promise<{ id: string; user_id: string; body: string; created_at: string; display_name: string | null; avatar_url: string | null }[]> => {
      const token = await getAccessToken();
      return apiFetch(`/api/community/chat/room/${chatRoom!.room_id}/messages?limit=100`, { token });
    },
    enabled: !!user && !!chatRoom?.room_id,
    refetchInterval: chatGroupId ? 3000 : false,
  });

  const { data: groupMembers = [], isLoading: groupMembersLoading } = useQuery({
    queryKey: ['community-group-members', membersGroupId, user?.id],
    queryFn: async (): Promise<GroupMember[]> => {
      const token = await getAccessToken();
      return apiFetch<GroupMember[]>(`/api/community/groups/${membersGroupId}/members`, { token });
    },
    enabled: !!user && isPremium && !!membersGroupId,
  });

  const sendChatMutation = useMutation({
    mutationFn: async (body: string) => {
      const token = await getAccessToken();
      return apiFetch(`/api/community/chat/room/${chatRoom!.room_id}/messages`, {
        method: 'POST',
        token,
        body: JSON.stringify({ body }),
      });
    },
    onSuccess: () => {
      setChatMessage('');
      queryClient.invalidateQueries({ queryKey: ['community-chat-messages'] });
    },
    onError: (err) => {
      toast({
        title: t('auth.community.messageBlocked'),
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  if (!isPremium) {
    return (
      <>
        <Helmet><title>Community | Shyftcut</title></Helmet>
        <PremiumGateCard
        variant="full"
        title={language === 'ar' ? 'المجتمع لمشتركي بريميوم' : 'Community is for Premium'}
        description={
          language === 'ar'
            ? 'انضم إلى أقرانك، شاهد لوحة المتصدرين، وابقَ متحفزاً. قم بالترقية للوصول.'
            : 'Connect with peers, see the leaderboard, and stay motivated. Upgrade to access.'
        }
        benefits={
          language === 'ar'
            ? ['لوحة المتصدرين', 'مجموعات الدراسة', 'الدردشة مع الأقران', 'الشارات والإنجازات']
            : ['Leaderboard & streaks', 'Study groups', 'Peer chat', 'Badges & achievements']
        }
      />
      </>
    );
  }

  return (
    <>
      <Helmet><title>Community | Shyftcut</title></Helmet>
      <div className="container mx-auto max-w-app-content px-4 pb-24 pt-6 sm:px-6 sm:py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold sm:text-3xl">{t('nav.community')}</h1>
          <p className="mt-1 text-muted-foreground">
            {language === 'ar' ? 'تواصل مع أقرانك وشاهد لوحة المتصدرين' : 'Connect with peers and see the leaderboard'}
          </p>
          {userBadges.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">{language === 'ar' ? 'شاراتك:' : 'Your badges:'}</span>
              {userBadges.map((b) => (
                <Badge key={b.badge_id} variant="secondary" className="gap-1">
                  <Crown className="h-3 w-3" />
                  {b.name}
                </Badge>
              ))}
            </div>
          )}
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Trophy className="h-5 w-5 text-primary" />
                {language === 'ar' ? 'لوحة المتصدرين' : 'Leaderboard'}
              </h2>
              <div className="flex gap-1 rounded-lg bg-muted/50 p-0.5">
                {(['all', 'week', 'month'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setLeaderboardPeriod(p)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      leaderboardPeriod === p
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {p === 'all' ? (language === 'ar' ? 'الكل' : 'All') : p === 'week' ? (language === 'ar' ? 'هذا الأسبوع' : 'This week') : (language === 'ar' ? 'هذا الشهر' : 'This month')}
                  </button>
                ))}
              </div>
            </div>
            {leaderboardLoading ? (
              <Skeleton className="h-64 w-full rounded-xl" />
            ) : (
              <Card className="public-glass-card rounded-2xl">
                <CardContent className="p-4">
                  <ul className="space-y-2">
                    {leaderboard.slice(0, 10).map((entry) => (
                      <li
                        key={entry.user_id}
                        className="flex items-center gap-3 rounded-lg border border-border/50 p-3"
                      >
                        <span className="w-6 text-sm font-bold text-muted-foreground">#{entry.rank}</span>
                        {entry.avatar_url ? (
                          <img src={entry.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                            {(entry.display_name || '?').charAt(0)}
                          </div>
                        )}
                        <span className="min-w-0 flex-1 truncate font-medium">
                          {entry.display_name || (language === 'ar' ? 'مستخدم' : 'User')}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-primary">
                          <Flame className="h-4 w-4" />
                          {entry.current_streak}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {leaderboard.length === 0 && (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      {language === 'ar' ? 'لا يوجد نشاط بعد.' : 'No activity yet.'}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Users className="h-5 w-5 text-primary" />
              {language === 'ar' ? 'ابحث عن أقرانك' : 'Find peers'}
            </h2>
            <div className="flex flex-wrap gap-2">
              <Select value={targetCareer || 'all'} onValueChange={(v) => setTargetCareer(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={language === 'ar' ? 'الوظيفة المستهدفة' : 'Target career'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'ar' ? 'الكل' : 'All careers'}</SelectItem>
                  {targetCareers.filter(Boolean).map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={experienceLevel || 'all'} onValueChange={(v) => setExperienceLevel(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={language === 'ar' ? 'مستوى الخبرة' : 'Experience level'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'ar' ? 'الكل' : 'All levels'}</SelectItem>
                  {experienceLevels.filter(Boolean).map((l) => (
                    <SelectItem key={l} value={l}>
                      {l === 'entry' ? (language === 'ar' ? 'مبتدئ' : 'Entry') : l === 'junior' ? (language === 'ar' ? 'مبتدئ+' : 'Junior') : l === 'mid' ? (language === 'ar' ? 'متوسط' : 'Mid') : l === 'senior' ? (language === 'ar' ? 'أقدم' : 'Senior') : (language === 'ar' ? 'تنفيذي' : 'Executive')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {peersLoading ? (
              <Skeleton className="h-48 w-full rounded-xl" />
            ) : (
              <Card className="public-glass-card rounded-2xl">
                <CardContent className="p-4">
                  <ul className="space-y-3">
                    {peers.slice(0, 15).map((peer) => (
                      <li
                        key={peer.user_id}
                        className="flex items-center gap-3 rounded-lg border border-border/50 p-3"
                      >
                        {peer.avatar_url ? (
                          <img src={peer.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                            {(peer.display_name || '?').charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{peer.display_name || (language === 'ar' ? 'مستخدم' : 'User')}</p>
                          <p className="text-xs text-muted-foreground">
                            {[peer.target_career, peer.experience_level].filter(Boolean).join(' · ') || '—'}
                          </p>
                          <p className="flex items-center gap-1 text-xs text-primary">
                            <Flame className="h-3 w-3" />
                            {peer.current_streak} {language === 'ar' ? 'يوم' : 'day'} streak
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {peer.linkedin_url && (
                            <a
                              href={peer.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary"
                              aria-label="LinkedIn"
                            >
                              <Link2 className="h-4 w-4" />
                            </a>
                          )}
                          <Button
                            size="sm"
                            variant={peer.connected ? 'secondary' : 'default'}
                            disabled={connectMutation.isPending}
                            onClick={() => connectMutation.mutate({ targetUserId: peer.user_id, connect: !peer.connected })}
                          >
                            {peer.connected ? (language === 'ar' ? 'متصل' : 'Connected') : (language === 'ar' ? 'ربط' : 'Connect')}
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  {peers.length === 0 && (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      {language === 'ar' ? 'لا يوجد أقران مطابقون. جرّب تغيير الفلاتر.' : 'No matching peers. Try changing filters.'}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.section>
        </div>

        {/* Badges discovery */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-10 space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Crown className="h-5 w-5 text-primary" />
            {language === 'ar' ? 'شارات يمكن اكتسابها' : 'Badges to earn'}
          </h2>
          {badgesLoading ? (
            <Skeleton className="h-32 w-full rounded-xl" />
          ) : (
            <Card className="public-glass-card rounded-2xl">
              <CardContent className="p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {allBadges.map((b) => (
                    <div
                      key={b.id}
                      className={`rounded-lg border p-3 ${
                        earnedBadgeIds.has(b.id)
                          ? 'border-primary/50 bg-primary/5'
                          : 'border-border/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Crown className={`h-4 w-4 ${earnedBadgeIds.has(b.id) ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="font-medium">{b.name}</span>
                        {earnedBadgeIds.has(b.id) && (
                          <Badge variant="secondary" className="text-xs">{language === 'ar' ? 'مكتسبة' : 'Earned'}</Badge>
                        )}
                      </div>
                      {b.description && <p className="mt-1 text-sm text-muted-foreground">{b.description}</p>}
                      {b.criteria && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {language === 'ar' ? 'المعايير: ' : 'Criteria: '}{b.criteria}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                {allBadges.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    {language === 'ar' ? 'لا توجد شارات.' : 'No badges available.'}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </motion.section>

        {/* Top groups by streak */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-10 space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Flame className="h-5 w-5 text-primary" />
            {language === 'ar' ? 'أفضل المجموعات بالامتداد' : 'Top groups by streak'}
          </h2>
          {topGroupsLoading ? (
            <Skeleton className="h-24 w-full rounded-xl" />
          ) : (
            <Card className="public-glass-card rounded-2xl">
              <CardContent className="p-4">
                <ul className="space-y-2">
                  {topGroupsByStreak.filter((g) => g.group_streak > 0).map((g, i) => (
                    <li key={g.id} className="flex items-center gap-3 rounded-lg border border-border/50 p-3">
                      <span className="w-6 text-sm font-bold text-muted-foreground">#{i + 1}</span>
                      <span className="min-w-0 flex-1 font-medium truncate">{g.name}</span>
                      <span className="flex items-center gap-1 text-sm text-primary">
                        <Flame className="h-4 w-4" />
                        {g.group_streak} {language === 'ar' ? 'يوم' : 'days'}
                      </span>
                      <span className="text-xs text-muted-foreground">{g.member_count} {language === 'ar' ? 'أعضاء' : 'members'}</span>
                    </li>
                  ))}
                </ul>
                {topGroupsByStreak.filter((g) => g.group_streak > 0).length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    {language === 'ar' ? 'لا توجد مجموعات لديها امتداد بعد. ادْرُس مع مجموعتك كل يوم!' : 'No groups with a streak yet. Study with your group every day!'}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <UserPlus className="h-5 w-5 text-primary" />
              {language === 'ar' ? 'مجموعات الدراسة' : 'Study groups'}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder={language === 'ar' ? 'الوظيفة' : 'Career'}
                value={groupTargetCareer}
                onChange={(e) => setGroupTargetCareer(e.target.value)}
                className="w-32 rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder={language === 'ar' ? 'المستوى' : 'Level'}
                value={groupExperienceLevel}
                onChange={(e) => setGroupExperienceLevel(e.target.value)}
                className="w-28 rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
              <Button size="sm" onClick={() => setCreateGroupOpen(true)} className="gap-1">
                <PlusCircle className="h-4 w-4" />
                {language === 'ar' ? 'إنشاء مجموعة' : 'Create group'}
              </Button>
            </div>
          </div>
          {createGroupOpen && (
            <Card className="public-glass-card rounded-2xl">
              <CardContent className="p-4 space-y-3">
                <input
                  type="text"
                  placeholder={language === 'ar' ? 'اسم المجموعة' : 'Group name'}
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
                <textarea
                  placeholder={language === 'ar' ? 'الوصف (اختياري)' : 'Description (optional)'}
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={!newGroupName.trim() || createGroupMutation.isPending}
                    onClick={() =>
                      createGroupMutation.mutate({
                        name: newGroupName.trim(),
                        description: newGroupDescription.trim() || undefined,
                        target_career: groupTargetCareer.trim() || undefined,
                        experience_level: groupExperienceLevel.trim() || undefined,
                      })
                    }
                  >
                    {createGroupMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {language === 'ar' ? 'إنشاء' : 'Create'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setCreateGroupOpen(false)}>
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          {groupsLoading ? (
            <Skeleton className="h-40 w-full rounded-xl" />
          ) : (
            <Card className="public-glass-card rounded-2xl">
              <CardContent className="p-4">
                <ul className="space-y-3">
                  {studyGroups.map((g) => (
                    <li key={g.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border/50 p-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{g.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {[g.target_career, g.experience_level].filter(Boolean).join(' · ') || '—'}
                          {' · '}
                          {g.member_count} {language === 'ar' ? 'أعضاء' : 'members'}
                        </p>
                        {g.creator_name && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {language === 'ar' ? 'بواسطة' : 'by'} {g.creator_name}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setMembersGroupId(g.id);
                            setMembersGroupName(g.name);
                          }}
                        >
                          <Users className="h-3 w-3 mr-1" />
                          {language === 'ar' ? 'الأعضاء' : 'Members'}
                        </Button>
                        {g.is_member && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setChatGroupId(g.id)}
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            {language === 'ar' ? 'دردشة' : 'Chat'}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant={g.is_member ? 'secondary' : 'default'}
                          disabled={joinGroupMutation.isPending}
                          onClick={() => joinGroupMutation.mutate({ groupId: g.id, join: !g.is_member })}
                        >
                          {g.is_member ? (
                            <>
                              <LogOut className="h-3 w-3 mr-1" />
                              {language === 'ar' ? 'غادر' : 'Leave'}
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-3 w-3 mr-1" />
                              {language === 'ar' ? 'انضم' : 'Join'}
                            </>
                          )}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
                {studyGroups.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    {language === 'ar' ? 'لا توجد مجموعات. أنشئ واحدة أو غيّر الفلاتر.' : 'No groups yet. Create one or change filters.'}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

        <Dialog open={!!membersGroupId} onOpenChange={(open) => !open && setMembersGroupId(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>
                {language === 'ar' ? 'أعضاء' : 'Members'}: {membersGroupName}
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-64 overflow-y-auto space-y-2 py-2">
              {groupMembersLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                groupMembers.map((m) => (
                  <li key={m.user_id} className="flex items-center gap-3 rounded-lg border border-border/50 p-2 list-none">
                    {m.avatar_url ? (
                      <img src={m.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {(m.display_name || '?').charAt(0)}
                      </div>
                    )}
                    <span className="min-w-0 flex-1 truncate font-medium text-sm">
                      {m.display_name || (language === 'ar' ? 'مستخدم' : 'User')}
                    </span>
                    {m.role === 'admin' && (
                      <Badge variant="secondary" className="text-xs">{language === 'ar' ? 'مسؤول' : 'Admin'}</Badge>
                    )}
                  </li>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Sheet open={!!chatGroupId} onOpenChange={(open) => !open && setChatGroupId(null)}>
          <SheetContent className="flex flex-col w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>{language === 'ar' ? 'دردشة المجموعة' : 'Group chat'}</SheetTitle>
            </SheetHeader>
            <div className="flex-1 flex flex-col min-h-0 mt-4">
              {chatRoomLoading || chatMessagesLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <ul className="flex-1 overflow-y-auto space-y-2 pb-4">
                    {chatMessages.map((msg) => (
                      <li key={msg.id} className={msg.user_id === user?.id ? 'text-end' : 'text-start'}>
                        <span className="text-xs text-muted-foreground block">
                          {msg.display_name || (language === 'ar' ? 'مستخدم' : 'User')}
                        </span>
                        <span className="inline-block rounded-lg bg-muted px-3 py-1.5 text-sm">{msg.body}</span>
                      </li>
                    ))}
                  </ul>
                  <form
                    className="flex gap-2 pt-2 border-t"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (chatMessage.trim() && !sendChatMutation.isPending) sendChatMutation.mutate(chatMessage.trim());
                    }}
                  >
                    <Input
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder={language === 'ar' ? 'رسالة...' : 'Message...'}
                      className="flex-1"
                    />
                    <Button type="submit" size="sm" disabled={!chatMessage.trim() || sendChatMutation.isPending}>
                      {sendChatMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (language === 'ar' ? 'إرسال' : 'Send')}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
        </motion.section>
      </div>
    </>
  );
}
