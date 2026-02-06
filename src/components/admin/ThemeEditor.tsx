import { useState } from 'react';
import { useCreateAdminTheme, useUpdateAdminTheme, Theme } from '@/hooks/useAdmin';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { ColorPicker } from './ColorPicker';

interface ThemeEditorProps {
  theme?: Theme | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const defaultColors = {
  background: '0 0% 100%',
  foreground: '240 10% 10%',
  primary: '250 95% 55%',
  secondary: '240 5% 96%',
  accent: '180 70% 45%',
  muted: '240 5% 96%',
  destructive: '0 84% 55%',
  border: '240 6% 90%',
  card: '0 0% 100%',
  popover: '0 0% 100%',
};

export function ThemeEditor({ theme, open, onOpenChange, onSuccess }: ThemeEditorProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [name, setName] = useState(theme?.name || '');
  const [description, setDescription] = useState(theme?.description || '');
  const [colors, setColors] = useState<Record<string, string>>(theme?.colors || defaultColors);
  const createTheme = useCreateAdminTheme();
  const updateTheme = useUpdateAdminTheme();

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'اسم السمة مطلوب' : 'Theme name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (theme) {
        await updateTheme.mutateAsync({
          themeId: theme.id,
          updates: { name, colors, description },
        });
      } else {
        await createTheme.mutateAsync({ name, colors, description });
      }
      toast({
        title: language === 'ar' ? 'تم الحفظ' : 'Saved',
        description: language === 'ar' ? 'تم حفظ السمة بنجاح' : 'Theme saved successfully',
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  const updateColor = (key: string, value: string) => {
    setColors({ ...colors, [key]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {theme ? (language === 'ar' ? 'تعديل السمة' : 'Edit Theme') : (language === 'ar' ? 'إنشاء سمة جديدة' : 'Create New Theme')}
          </DialogTitle>
          <DialogDescription>
            {language === 'ar' ? 'تخصيص ألوان السمة' : 'Customize theme colors'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{language === 'ar' ? 'الاسم' : 'Name'}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === 'ar' ? 'اسم السمة...' : 'Theme name...'}
            />
          </div>

          <div className="space-y-2">
            <Label>{language === 'ar' ? 'الوصف' : 'Description'}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={language === 'ar' ? 'وصف السمة...' : 'Theme description...'}
              rows={2}
            />
          </div>

          <div className="space-y-4">
            <Label>{language === 'ar' ? 'الألوان' : 'Colors'}</Label>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(defaultColors).map(([key]) => (
                <div key={key} className="space-y-2">
                  <Label className="text-sm capitalize">{key}</Label>
                  <ColorPicker
                    value={colors[key] || defaultColors[key as keyof typeof defaultColors]}
                    onChange={(value) => updateColor(key, value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={createTheme.isPending || updateTheme.isPending}
          >
            {language === 'ar' ? 'حفظ' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
