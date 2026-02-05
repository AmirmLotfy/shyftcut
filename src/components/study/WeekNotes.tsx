import { useState } from 'react';
import { FileText, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
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
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotes, type Note } from '@/hooks/useNotes';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { useToast } from '@/hooks/use-toast';
import { UpgradePrompt } from '@/components/common/UpgradePrompt';

interface WeekNotesProps {
  roadmapWeekId: string;
}

export function WeekNotes({ roadmapWeekId }: WeekNotesProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canCreateNote, getNotesRemaining, limits } = useUsageLimits();
  const { notes, isLoading, createNote, updateNote, deleteNote } = useNotes(roadmapWeekId);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showNotesUpgrade, setShowNotesUpgrade] = useState(false);
  const atNotesLimit = !canCreateNote();

  const resetForm = () => {
    setTitle('');
    setContent('');
    setShowAdd(false);
    setEditing(null);
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
      <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
        <FileText className="h-4 w-4" />
        {t('study.notes')}
      </h4>
      <div className="space-y-2">
        {notes.length === 0 && !showAdd && !editing && (
          <p className="text-sm text-muted-foreground">{t('study.noNotes')}</p>
        )}
        {notes.map((note) => (
          <div
            key={note.id}
            className="flex items-start justify-between gap-2 rounded-lg border border-border bg-muted/30 p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm">{note.title}</p>
              {note.content && (
                <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground line-clamp-2">
                  {note.content}
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-1">
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
        ))}
        {showAdd && (
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('study.notesPlaceholder')}
              className="text-sm"
            />
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('study.notesContentPlaceholder')}
              className="min-h-[60px] text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={!title.trim() || createNote.isPending}>
                {createNote.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.save')}
              </Button>
              <Button size="sm" variant="outline" onClick={resetForm}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        )}
        {!showAdd && !editing && (
          atNotesLimit ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
              <span className="text-sm text-muted-foreground">
                {t('study.notesLimitReached')} ({limits.notes})
              </span>
              <Button size="sm" variant="default" onClick={() => setShowNotesUpgrade(true)}>
                {t('pricing.upgrade')}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => setShowAdd(true)}
            >
              <Plus className="h-4 w-4" />
              {t('study.notesAdd')}
            </Button>
          )
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
        <DialogContent className="max-w-md" aria-describedby="edit-note-desc">
          <DialogHeader>
            <DialogTitle>{t('common.edit')}</DialogTitle>
            <DialogDescription id="edit-note-desc" className="sr-only">
              {t('study.notesContentPlaceholder')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('study.notesPlaceholder')}
            />
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('study.notesContentPlaceholder')}
              className="min-h-[100px]"
            />
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
