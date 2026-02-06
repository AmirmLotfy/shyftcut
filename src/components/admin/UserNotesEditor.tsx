import { useState } from 'react';
import { useUpdateAdminUserNotes } from '@/hooks/useAdmin';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Save } from 'lucide-react';

interface UserNotesEditorProps {
  userId: string;
  initialNotes: string;
}

export function UserNotesEditor({ userId, initialNotes }: UserNotesEditorProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [notes, setNotes] = useState(initialNotes);
  const updateNotes = useUpdateAdminUserNotes();

  const handleSave = async () => {
    try {
      await updateNotes.mutateAsync({ userId, notes });
      toast({
        title: language === 'ar' ? 'تم الحفظ' : 'Saved',
        description: language === 'ar' ? 'تم حفظ الملاحظات' : 'Notes saved successfully',
      });
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={language === 'ar' ? 'أضف ملاحظات حول هذا المستخدم...' : 'Add notes about this user...'}
        className="min-h-[200px]"
      />
      <Button onClick={handleSave} disabled={updateNotes.isPending}>
        <Save className="h-4 w-4 mr-2" />
        {language === 'ar' ? 'حفظ' : 'Save'}
      </Button>
    </div>
  );
}
