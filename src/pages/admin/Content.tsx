import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface Roadmap {
  id: string;
  title: string;
  created_at: string;
  profiles?: { display_name?: string; email?: string };
}

interface ChatMessage {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: { display_name?: string; email?: string };
}

interface CommunityData {
  groups: Array<{ id: string; name: string; created_at: string; profiles?: { display_name?: string } }>;
  messages: Array<{ id: string; body: string; created_at: string; profiles?: { display_name?: string } }>;
}

function useAdminRoadmaps(search?: string, page = 1) {
  const { getAccessToken } = useAuth();
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  params.set('page', String(page));
  params.set('limit', '50');

  return useQuery({
    queryKey: ['admin', 'content', 'roadmaps', search, page],
    queryFn: async () => {
      const token = await getAccessToken();
      return apiFetch<{ roadmaps: Roadmap[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
        `/api/admin/content/roadmaps?${params.toString()}`,
        { token }
      );
    },
  });
}

function useAdminChatMessages(userId?: string, search?: string, page = 1) {
  const { getAccessToken } = useAuth();
  const params = new URLSearchParams();
  if (userId) params.set('user_id', userId);
  if (search) params.set('search', search);
  params.set('page', String(page));
  params.set('limit', '50');

  return useQuery({
    queryKey: ['admin', 'content', 'chat', userId, search, page],
    queryFn: async () => {
      const token = await getAccessToken();
      return apiFetch<{ messages: ChatMessage[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
        `/api/admin/content/chat?${params.toString()}`,
        { token }
      );
    },
  });
}

function useAdminCommunity() {
  const { getAccessToken } = useAuth();
  return useQuery({
    queryKey: ['admin', 'content', 'community'],
    queryFn: async () => {
      const token = await getAccessToken();
      return apiFetch<CommunityData>('/api/admin/content/community', { token });
    },
  });
}

export function Content() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { getAccessToken } = useAuth();
  const [activeTab, setActiveTab] = useState('roadmaps');
  const [roadmapSearch, setRoadmapSearch] = useState('');
  const [chatSearch, setChatSearch] = useState('');
  const [roadmapPage, setRoadmapPage] = useState(1);
  const [chatPage, setChatPage] = useState(1);
  const [deleteRoadmapId, setDeleteRoadmapId] = useState<string | null>(null);
  const [deleteMessageId, setDeleteMessageId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { data: roadmapsData, isLoading: roadmapsLoading } = useAdminRoadmaps(roadmapSearch || undefined, roadmapPage);
  const { data: chatData, isLoading: chatLoading } = useAdminChatMessages(undefined, chatSearch || undefined, chatPage);
  const { data: communityData, isLoading: communityLoading } = useAdminCommunity();

  const handleDeleteRoadmap = async (id: string) => {
    try {
      const token = await getAccessToken();
      await apiFetch(`/api/admin/content/roadmaps/${id}`, {
        method: 'DELETE',
        token,
      });
      toast({ title: language === 'ar' ? 'تم الحذف' : 'Roadmap deleted' });
      setDeleteRoadmapId(null);
      setDeleteConfirm(false);
    } catch (error) {
      toast({ title: language === 'ar' ? 'خطأ' : 'Error', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handleDeleteMessage = async (id: string) => {
    try {
      const token = await getAccessToken();
      await apiFetch(`/api/admin/content/chat/${id}`, {
        method: 'DELETE',
        token,
      });
      toast({ title: language === 'ar' ? 'تم الحذف' : 'Message deleted' });
      setDeleteMessageId(null);
      setDeleteConfirm(false);
    } catch (error) {
      toast({ title: language === 'ar' ? 'خطأ' : 'Error', description: (error as Error).message, variant: 'destructive' });
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{language === 'ar' ? 'إدارة المحتوى' : 'Content Moderation'}</h1>
        <p className="text-muted-foreground mt-1">{language === 'ar' ? 'إدارة ومراقبة محتوى المنصة' : 'Manage and moderate platform content'}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="roadmaps">{language === 'ar' ? 'خارطة الطريق' : 'Roadmaps'}</TabsTrigger>
          <TabsTrigger value="chat">{language === 'ar' ? 'الدردشة' : 'Chat'}</TabsTrigger>
          <TabsTrigger value="community">{language === 'ar' ? 'المجتمع' : 'Community'}</TabsTrigger>
        </TabsList>

        <TabsContent value="roadmaps" className="mt-4 space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === 'ar' ? 'بحث في خارطة الطريق...' : 'Search roadmaps...'}
                value={roadmapSearch}
                onChange={(e) => setRoadmapSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'ar' ? 'العنوان' : 'Title'}</TableHead>
                  <TableHead>{language === 'ar' ? 'المستخدم' : 'User'}</TableHead>
                  <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roadmapsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : roadmapsData?.roadmaps.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      {language === 'ar' ? 'لا توجد نتائج' : 'No results found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  roadmapsData?.roadmaps.map((roadmap: Roadmap) => (
                    <TableRow key={roadmap.id}>
                      <TableCell className="font-medium">{roadmap.title}</TableCell>
                      <TableCell>
                        {(roadmap.profiles as { display_name?: string; email?: string })?.display_name ||
                          (roadmap.profiles as { email?: string })?.email ||
                          '-'}
                      </TableCell>
                      <TableCell>{new Date(roadmap.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            setDeleteRoadmapId(roadmap.id);
                            setDeleteConfirm(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {roadmapsData && roadmapsData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'عرض' : 'Showing'} {((roadmapPage - 1) * 50) + 1} - {Math.min(roadmapPage * 50, roadmapsData.pagination.total)} {language === 'ar' ? 'من' : 'of'} {roadmapsData.pagination.total}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={roadmapPage === 1} onClick={() => setRoadmapPage(roadmapPage - 1)} className="min-h-[44px]">
                  {language === 'ar' ? 'السابق' : 'Previous'}
                </Button>
                <Button variant="outline" size="sm" disabled={roadmapPage >= roadmapsData.pagination.totalPages} onClick={() => setRoadmapPage(roadmapPage + 1)} className="min-h-[44px]">
                  {language === 'ar' ? 'التالي' : 'Next'}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="chat" className="mt-4 space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === 'ar' ? 'بحث في الرسائل...' : 'Search messages...'}
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'ar' ? 'المستخدم' : 'User'}</TableHead>
                  <TableHead>{language === 'ar' ? 'الرسالة' : 'Message'}</TableHead>
                  <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chatLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : chatData?.messages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      {language === 'ar' ? 'لا توجد نتائج' : 'No results found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  chatData?.messages.map((message: ChatMessage) => (
                    <TableRow key={message.id}>
                      <TableCell>
                        {(message.profiles as { display_name?: string; email?: string })?.display_name ||
                          (message.profiles as { email?: string })?.email ||
                          '-'}
                      </TableCell>
                      <TableCell className="max-w-md truncate">{message.content.slice(0, 100)}...</TableCell>
                      <TableCell>{new Date(message.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            setDeleteMessageId(message.id);
                            setDeleteConfirm(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {chatData && chatData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'عرض' : 'Showing'} {((chatPage - 1) * 50) + 1} - {Math.min(chatPage * 50, chatData.pagination.total)} {language === 'ar' ? 'من' : 'of'} {chatData.pagination.total}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={chatPage === 1} onClick={() => setChatPage(chatPage - 1)} className="min-h-[44px]">
                  {language === 'ar' ? 'السابق' : 'Previous'}
                </Button>
                <Button variant="outline" size="sm" disabled={chatPage >= chatData.pagination.totalPages} onClick={() => setChatPage(chatPage + 1)} className="min-h-[44px]">
                  {language === 'ar' ? 'التالي' : 'Next'}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="community" className="mt-4 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">{language === 'ar' ? 'مجموعات الدراسة' : 'Study Groups'}</h3>
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === 'ar' ? 'الاسم' : 'Name'}</TableHead>
                    <TableHead>{language === 'ar' ? 'المنشئ' : 'Creator'}</TableHead>
                    <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {communityLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      </TableRow>
                    ))
                  ) : communityData?.groups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                        {language === 'ar' ? 'لا توجد مجموعات' : 'No groups found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    communityData?.groups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell className="font-medium">{group.name}</TableCell>
                        <TableCell>{(group.profiles as { display_name?: string })?.display_name || '-'}</TableCell>
                        <TableCell>{new Date(group.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">{language === 'ar' ? 'رسائل المجتمع' : 'Community Messages'}</h3>
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === 'ar' ? 'المستخدم' : 'User'}</TableHead>
                    <TableHead>{language === 'ar' ? 'الرسالة' : 'Message'}</TableHead>
                    <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {communityLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      </TableRow>
                    ))
                  ) : communityData?.messages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                        {language === 'ar' ? 'لا توجد رسائل' : 'No messages found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    communityData?.messages.map((message) => (
                      <TableRow key={message.id}>
                        <TableCell>{(message.profiles as { display_name?: string })?.display_name || '-'}</TableCell>
                        <TableCell className="max-w-md truncate">{message.body.slice(0, 100)}...</TableCell>
                        <TableCell>{new Date(message.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmations */}
      <Dialog open={deleteConfirm && !!deleteRoadmapId} onOpenChange={setDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}</DialogTitle>
            <DialogDescription>
              {language === 'ar' ? 'هل أنت متأكد من حذف خارطة الطريق هذه؟' : 'Are you sure you want to delete this roadmap?'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteConfirm(false); setDeleteRoadmapId(null); }} className="min-h-[44px]">
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button variant="destructive" onClick={() => deleteRoadmapId && handleDeleteRoadmap(deleteRoadmapId)} className="min-h-[44px]">
              {language === 'ar' ? 'حذف' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirm && !!deleteMessageId} onOpenChange={setDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}</DialogTitle>
            <DialogDescription>
              {language === 'ar' ? 'هل أنت متأكد من حذف هذه الرسالة؟' : 'Are you sure you want to delete this message?'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteConfirm(false); setDeleteMessageId(null); }} className="min-h-[44px]">
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button variant="destructive" onClick={() => deleteMessageId && handleDeleteMessage(deleteMessageId)} className="min-h-[44px]">
              {language === 'ar' ? 'حذف' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
