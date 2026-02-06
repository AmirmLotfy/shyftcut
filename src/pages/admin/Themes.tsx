import { useState } from 'react';
import { useAdminThemes, useDeleteAdminTheme, useSetDefaultTheme, Theme } from '@/hooks/useAdmin';
import { useLanguage } from '@/contexts/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ThemeEditor } from '@/components/admin/ThemeEditor';
import { Plus, Edit, Trash2, Star } from 'lucide-react';

export function Themes() {
  const { language } = useLanguage();
  const { data, isLoading, refetch } = useAdminThemes();
  const deleteTheme = useDeleteAdminTheme();
  const setDefault = useSetDefaultTheme();
  const { toast } = useToast();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{language === 'ar' ? 'إدارة السمات' : 'Theme Management'}</h1>
          <p className="text-muted-foreground mt-1">{language === 'ar' ? 'إنشاء وإدارة سمات الموقع' : 'Create and manage site themes'}</p>
        </div>
        <Button onClick={() => { setEditingTheme(null); setEditorOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          {language === 'ar' ? 'إنشاء سمة جديدة' : 'Create Theme'}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.themes.map((theme) => (
            <Card key={theme.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{theme.name}</CardTitle>
                  {theme.is_default && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                      {language === 'ar' ? 'افتراضي' : 'Default'}
                    </span>
                  )}
                </div>
                {theme.description && (
                  <CardDescription>{theme.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2 flex-wrap">
                  {theme.is_default && (
                    <Badge variant="default" className="w-full justify-center">
                      <Star className="h-3 w-3 mr-1" />
                      {language === 'ar' ? 'افتراضي' : 'Default'}
                    </Badge>
                  )}
                  {theme.is_admin_created && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setEditingTheme(theme);
                        setEditorOpen(true);
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      {language === 'ar' ? 'تعديل' : 'Edit'}
                    </Button>
                  )}
                  {!theme.is_default && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setDefault.mutate(theme.id, {
                          onSuccess: () => {
                            toast({
                              title: language === 'ar' ? 'تم التحديث' : 'Updated',
                              description: language === 'ar' ? 'تم تعيين السمة الافتراضية' : 'Theme set as default',
                            });
                            refetch();
                          },
                        });
                      }}
                    >
                      <Star className="h-3 w-3 mr-1" />
                      {language === 'ar' ? 'افتراضي' : 'Set Default'}
                    </Button>
                  )}
                  {theme.is_admin_created && !theme.is_default && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        if (confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذه السمة؟' : 'Are you sure you want to delete this theme?')) {
                          deleteTheme.mutate(theme.id, {
                            onSuccess: () => {
                              toast({
                                title: language === 'ar' ? 'تم الحذف' : 'Deleted',
                                description: language === 'ar' ? 'تم حذف السمة' : 'Theme deleted',
                              });
                              refetch();
                            },
                          });
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      {language === 'ar' ? 'حذف' : 'Delete'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Theme Editor */}
      <ThemeEditor
        theme={editingTheme}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onSuccess={() => {
          refetch();
          setEditingTheme(null);
        }}
      />
    </div>
  );
}
