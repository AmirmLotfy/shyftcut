import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch, apiPath, apiHeaders } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Theme {
  id: string;
  name: string;
  colors: Record<string, string>;
  is_default: boolean;
}

export function ThemeSelector() {
  const { language } = useLanguage();
  const { user, getAccessToken } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Fetch available themes (public endpoint - no auth required)
  const { data: themesData } = useQuery({
    queryKey: ['themes'],
    queryFn: async () => {
      return apiFetch<{ themes: Theme[] }>('/api/themes');
    },
  });

  // Fetch user's current theme preference
  const { data: userProfile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const token = await getAccessToken();
      const profile = await apiFetch<{ preferred_theme_id?: string }>('/api/profile', { token });
      return profile;
    },
    enabled: !!user,
  });

  const updateThemeMutation = useMutation({
    mutationFn: async (themeId: string | null) => {
      if (!user) return;
      const token = await getAccessToken();
      return apiFetch('/api/profile', {
        method: 'PATCH',
        token,
        body: JSON.stringify({ preferred_theme_id: themeId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  const applyTheme = useCallback((theme: Theme) => {
    // Apply theme colors to CSS variables
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });

    // Save preference if user is logged in
    if (user) {
      updateThemeMutation.mutate(theme.id);
    } else {
      // For anonymous users, save to localStorage
      localStorage.setItem('shyftcut-theme-id', theme.id);
    }
  }, [user, updateThemeMutation]);

  // Load theme on mount
  useEffect(() => {
    if (themesData?.themes && themesData.themes.length > 0) {
      const savedThemeId = user ? userProfile?.preferred_theme_id : localStorage.getItem('shyftcut-theme-id');
      const themeToApply = themesData.themes.find(t => t.id === savedThemeId) || themesData.themes.find(t => t.is_default);
      if (themeToApply) {
        applyTheme(themeToApply);
      }
    }
  }, [themesData, userProfile?.preferred_theme_id, user, applyTheme]);

  const currentThemeId = user
    ? (userProfile?.preferred_theme_id || themesData?.themes.find(t => t.is_default)?.id)
    : (localStorage.getItem('shyftcut-theme-id') || themesData?.themes.find(t => t.is_default)?.id);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="min-h-[44px] min-w-[44px]">
          <Palette className="h-4 w-4" />
          <span className="sr-only">{language === 'ar' ? 'اختر السمة' : 'Select theme'}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="end">
        <div className="space-y-1">
          <div className="px-2 py-1.5 text-sm font-semibold">
            {language === 'ar' ? 'السمات' : 'Themes'}
          </div>
          {themesData?.themes.map((theme) => {
            const isSelected = currentThemeId === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => {
                  applyTheme(theme);
                  setOpen(false);
                }}
                className={cn(
                  'w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-md hover:bg-accent',
                  isSelected && 'bg-accent'
                )}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{
                      backgroundColor: `hsl(${theme.colors.primary || '250 95% 55%'})`,
                    }}
                  />
                  <span>{theme.name}</span>
                </div>
                {isSelected && <Check className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
