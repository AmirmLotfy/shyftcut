import { useState } from 'react';
import { useUpdateAdminUserTags } from '@/hooks/useAdmin';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { X, Plus } from 'lucide-react';

interface UserTagsManagerProps {
  userId: string;
  initialTags: string[];
}

export function UserTagsManager({ userId, initialTags }: UserTagsManagerProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [tags, setTags] = useState<string[]>(initialTags);
  const [newTag, setNewTag] = useState('');
  const updateTags = useUpdateAdminUserTags();

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    const tagToAdd = newTag.trim();
    if (tags.includes(tagToAdd)) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'العلامة موجودة بالفعل' : 'Tag already exists',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateTags.mutateAsync({ userId, action: 'add', tags: [tagToAdd] });
      setTags([...tags, tagToAdd]);
      setNewTag('');
      toast({
        title: language === 'ar' ? 'تمت الإضافة' : 'Added',
        description: language === 'ar' ? 'تمت إضافة العلامة' : 'Tag added successfully',
      });
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  const handleRemoveTag = async (tag: string) => {
    try {
      await updateTags.mutateAsync({ userId, action: 'remove', tags: [tag] });
      setTags(tags.filter(t => t !== tag));
      toast({
        title: language === 'ar' ? 'تم الحذف' : 'Removed',
        description: language === 'ar' ? 'تم حذف العلامة' : 'Tag removed successfully',
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
      <div className="flex gap-2">
        <Input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
          placeholder={language === 'ar' ? 'أضف علامة جديدة...' : 'Add new tag...'}
        />
        <Button onClick={handleAddTag} size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {language === 'ar' ? 'لا توجد علامات' : 'No tags'}
          </p>
        ) : (
          tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        )}
      </div>
    </div>
  );
}
