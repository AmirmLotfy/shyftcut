import { useState, useRef } from 'react';
import { FileText, Plus, Pencil, Trash2, Loader2, Bold, Italic, Code, List, Link as LinkIcon, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotes, type Note } from '@/hooks/useNotes';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { useToast } from '@/hooks/use-toast';
import { UpgradePrompt } from '@/components/common/UpgradePrompt';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface WeekNotesProps {
  roadmapWeekId: string;
}

export function WeekNotes({ roadmapWeekId }: WeekNotesProps) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canCreateNote, getNotesRemaining, limits } = useUsageLimits();
  const { notes, isLoading, createNote, updateNote, deleteNote } = useNotes(roadmapWeekId);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showNotesUpgrade, setShowNotesUpgrade] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');
  const atNotesLimit = !canCreateNote();
  const addContentRef = useRef<HTMLTextAreaElement>(null);
  const editContentRef = useRef<HTMLTextAreaElement>(null);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setShowAdd(false);
    setEditing(null);
    setViewMode('preview');
  };

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = editing ? editContentRef.current : addContentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.slice(start, end);
    const newText = content.slice(0, start) + prefix + selectedText + suffix + content.slice(end);
    setContent(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 0);
  };

  const handleCreate = () => {
    if (!title.trim()) return;
    if (atNotesLimit) {
      setShowNotesUpgrade(true);
      return;
    }
    createNote.mutate(
      { title: title.trim(), content: content.trim(), roadmap_week_id: roadmapWeekId },
      {
        onSuccess: () => {
          resetForm();
          queryClient.invalidateQueries({ queryKey: ['usage-limits'] });
          toast({ title: t('common.saved') });
        },
        onError: (err: unknown) => {
          const message = err instanceof Error ? err.message : String(err);
          if (message.includes('limit') || message.toLowerCase().includes('upgrade')) setShowNotesUpgrade(true);
          else toast({ title: t('common.errorTitle'), variant: 'destructive' });
        },
      }
    );
  };

  const handleUpdate = () => {
    if (!editing || !title.trim()) return;
    updateNote.mutate(
      { id: editing.id, title: title.trim(), content: content.trim() },
      {
        onSuccess: () => {
          resetForm();
          toast({ title: t('common.saved') });
        },
        onError: () => toast({ title: t('common.errorTitle'), variant: 'destructive' }),
      }
    );
  };

  const handleDelete = (note: Note) => {
    deleteNote.mutate(note.id, {
      onSuccess: () => toast({ title: t('common.saved') }),
      onError: () => toast({ title: t('common.errorTitle'), variant: 'destructive' }),
    });
  };

  const openEdit = (note: Note) => {
    setEditing(note);
    setTitle(note.title);
    setContent(note.content);
    setViewMode('edit');
  };

  if (isLoading) {
    return (
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-sm font-semibold">
          <FileText className="h-4 w-4 text-primary" />
          {t('study.notes')}
        </h4>
        {!showAdd && !editing && !atNotesLimit && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8"
            onClick={() => setShowAdd(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            {t('study.notesAdd')}
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {notes.length === 0 && !showAdd && !editing && (
          <div className="rounded-xl border-2 border-dashed border-border/50 bg-muted/20 p-8 text-center">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">{t('study.noNotes')}</p>
          </div>
        )}

        {notes.map((note) => (
          <motion.div
            key={note.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative overflow-hidden rounded-xl border-2 border-border/40 bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl shadow-sm hover:border-primary/30 hover:shadow-md transition-all"
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h5 className="font-semibold text-base text-foreground flex-1 min-w-0">{note.title}</h5>
                <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(note)}
                    aria-label={t('common.edit')}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(note)}
                    aria-label={t('common.delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {note.content && (
                <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-p:text-muted-foreground prose-p:leading-relaxed prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-strong:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {note.content}
                  </ReactMarkdown>
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-border/30 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{new Date(note.created_at).toLocaleDateString(language === 'ar' ? 'ar' : undefined, { month: 'short', day: 'numeric' })}</span>
                {note.updated_at !== note.created_at && (
                  <>
                    <span>•</span>
                    <span>{language === 'ar' ? 'محدث' : 'Updated'}</span>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {showAdd && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl shadow-lg p-4"
          >
            <div className="space-y-3">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('study.notesPlaceholder')}
                className="text-sm font-semibold"
              />
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'preview' | 'edit')} className="w-full">
                <div className="flex items-center justify-between mb-2">
                  <TabsList className="h-8">
                    <TabsTrigger value="edit" className="text-xs px-3">{language === 'ar' ? 'تحرير' : 'Edit'}</TabsTrigger>
                    <TabsTrigger value="preview" className="text-xs px-3">{language === 'ar' ? 'معاينة' : 'Preview'}</TabsTrigger>
                  </TabsList>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => insertMarkdown('**', '**')}
                      title="Bold"
                    >
                      <Bold className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => insertMarkdown('*', '*')}
                      title="Italic"
                    >
                      <Italic className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => insertMarkdown('`', '`')}
                      title="Code"
                    >
                      <Code className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => insertMarkdown('- ')}
                      title="List"
                    >
                      <List className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <TabsContent value="edit" className="mt-0">
                  <Textarea
                    ref={addContentRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={t('study.notesContentPlaceholder')}
                    className="min-h-[120px] text-sm font-mono"
                  />
                </TabsContent>
                <TabsContent value="preview" className="mt-0">
                  <div className="min-h-[120px] rounded-lg border border-border/50 bg-muted/20 p-3 prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-p:text-muted-foreground prose-p:leading-relaxed prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-strong:text-foreground prose-a:text-primary">
                    {content ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {content}
                      </ReactMarkdown>
                    ) : (
                      <p className="text-muted-foreground/50 text-sm italic">{language === 'ar' ? 'ابدأ الكتابة لرؤية المعاينة...' : 'Start typing to see preview...'}</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreate} disabled={!title.trim() || createNote.isPending} className="flex-1">
                  {createNote.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.save')}
                </Button>
                <Button size="sm" variant="outline" onClick={resetForm}>
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {atNotesLimit && !showAdd && !editing && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
            <span className="text-sm text-muted-foreground">
              {t('study.notesLimitReached')} ({limits.notes})
            </span>
            <Button size="sm" variant="default" onClick={() => setShowNotesUpgrade(true)}>
              {t('pricing.upgrade')}
            </Button>
          </div>
        )}
      </div>

      {showNotesUpgrade && (
        <Dialog open={showNotesUpgrade} onOpenChange={setShowNotesUpgrade}>
          <DialogContent className="max-w-md" aria-describedby="notes-upgrade-desc">
            <DialogTitle className="sr-only">{t('study.notesLimit')}</DialogTitle>
            <DialogDescription id="notes-upgrade-desc" className="sr-only">
              {t('study.notesLimitReached')}
            </DialogDescription>
            <UpgradePrompt feature="notes" remaining={getNotesRemaining()} limit={limits.notes} />
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="edit-note-desc">
          <DialogHeader>
            <DialogTitle>{t('common.edit')}</DialogTitle>
            <DialogDescription id="edit-note-desc" className="sr-only">
              {t('study.notesContentPlaceholder')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('study.notesPlaceholder')}
              className="font-semibold"
            />
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'preview' | 'edit')} className="w-full">
              <div className="flex items-center justify-between mb-2">
                <TabsList>
                  <TabsTrigger value="edit">{language === 'ar' ? 'تحرير' : 'Edit'}</TabsTrigger>
                  <TabsTrigger value="preview">{language === 'ar' ? 'معاينة' : 'Preview'}</TabsTrigger>
                </TabsList>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => insertMarkdown('**', '**')}
                    title="Bold"
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => insertMarkdown('*', '*')}
                    title="Italic"
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => insertMarkdown('`', '`')}
                    title="Code"
                  >
                    <Code className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => insertMarkdown('- ')}
                    title="List"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <TabsContent value="edit" className="mt-0">
                <Textarea
                  ref={editContentRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t('study.notesContentPlaceholder')}
                  className="min-h-[200px] font-mono"
                />
              </TabsContent>
              <TabsContent value="preview" className="mt-0">
                <div className="min-h-[200px] rounded-lg border border-border/50 bg-muted/20 p-4 prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-p:text-muted-foreground prose-p:leading-relaxed prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-strong:text-foreground prose-a:text-primary">
                  {content ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {content}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-muted-foreground/50 italic">{language === 'ar' ? 'ابدأ الكتابة لرؤية المعاينة...' : 'Start typing to see preview...'}</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleUpdate} disabled={!title.trim() || updateNote.isPending}>
              {updateNote.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
