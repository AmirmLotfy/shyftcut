import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Settings2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRoadmap } from '@/hooks/useRoadmap';
import { dashboardPaths } from '@/lib/dashboard-routes';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'shyftcut-pomodoro';

type Phase = 'work' | 'short_break' | 'long_break';

const defaultSettings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
  soundOnPhaseChange: true,
};

function loadSettings(): typeof defaultSettings {
  if (typeof window === 'undefined') return defaultSettings;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as Partial<typeof defaultSettings>;
    return {
      workMinutes: Math.min(60, Math.max(1, parsed.workMinutes ?? defaultSettings.workMinutes)),
      shortBreakMinutes: Math.min(30, Math.max(1, parsed.shortBreakMinutes ?? defaultSettings.shortBreakMinutes)),
      longBreakMinutes: Math.min(45, Math.max(1, parsed.longBreakMinutes ?? defaultSettings.longBreakMinutes)),
      sessionsBeforeLongBreak: Math.min(10, Math.max(1, parsed.sessionsBeforeLongBreak ?? defaultSettings.sessionsBeforeLongBreak)),
      soundOnPhaseChange: typeof parsed.soundOnPhaseChange === 'boolean' ? parsed.soundOnPhaseChange : defaultSettings.soundOnPhaseChange,
    };
  } catch {
    return defaultSettings;
  }
}

function saveSettings(settings: typeof defaultSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function playPhaseChangeSound() {
  if (typeof window === 'undefined') return;
  const Ctx = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
    || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  try {
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    /* ignore */
  }
}

export default function Study() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const { activeRoadmap } = useRoadmap();
  const [settings, setSettings] = useState(loadSettings);
  const [phase, setPhase] = useState<Phase>('work');
  const [secondsLeft, setSecondsLeft] = useState(settings.workMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const totalSeconds = {
    work: settings.workMinutes * 60,
    short_break: settings.shortBreakMinutes * 60,
    long_break: settings.longBreakMinutes * 60,
  };

  const phaseLabel = {
    work: isAr ? 'تركيز' : 'Focus',
    short_break: isAr ? 'استراحة قصيرة' : 'Short break',
    long_break: isAr ? 'استراحة طويلة' : 'Long break',
  };

  const resetTimer = useCallback((newPhase?: Phase) => {
    const next = newPhase ?? phase;
    setPhase(next);
    setSecondsLeft(next === 'work' ? totalSeconds.work : next === 'short_break' ? totalSeconds.short_break : totalSeconds.long_break);
  }, [phase, totalSeconds.work, totalSeconds.short_break, totalSeconds.long_break]);

  const phaseRef = useRef(phase);
  const sessionCountRef = useRef(sessionCount);
  phaseRef.current = phase;
  sessionCountRef.current = sessionCount;

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
          const currentPhase = phaseRef.current;
          const currentSession = sessionCountRef.current;
          const nextPhase: Phase = currentPhase === 'work'
            ? (currentSession + 1 >= settings.sessionsBeforeLongBreak ? 'long_break' : 'short_break')
            : 'work';
          if (nextPhase === 'work') setSessionCount((c) => c + 1);
          else if (nextPhase === 'long_break') setSessionCount(0);
          setPhase(nextPhase);
          const nextTotal = nextPhase === 'work' ? totalSeconds.work : nextPhase === 'short_break' ? totalSeconds.short_break : totalSeconds.long_break;
          setSecondsLeft(nextTotal);
          if (typeof document !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(isAr ? 'انتهى الوقت' : 'Time\'s up!', {
              body: nextPhase === 'work' ? (isAr ? 'ابدأ جلسة تركيز' : 'Start a focus session') : (isAr ? 'خذ استراحة' : 'Take a break'),
            });
          }
          if (settingsRef.current.soundOnPhaseChange) playPhaseChangeSound();
          return nextTotal;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, settings.sessionsBeforeLongBreak, totalSeconds.work, totalSeconds.short_break, totalSeconds.long_break, isAr]);

  useEffect(() => {
    resetTimer(phase);
  }, [settings.workMinutes, settings.shortBreakMinutes, settings.longBreakMinutes]);

  const handleSettingsSave = (newSettings: typeof defaultSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    resetTimer('work');
    setSessionCount(0);
  };

  return (
    <>
      <div className="container mx-auto max-w-app-content px-4 pb-24 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold md:text-3xl">
            {isAr ? 'جلسة تركيز' : 'Focus session'}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {isAr ? 'مؤقت بومودورو لجدولة العمل والاستراحات' : 'Pomodoro timer to schedule work and breaks'}
          </p>
          {activeRoadmap?.roadmap_weeks?.length ? (() => {
            const weeks = (activeRoadmap.roadmap_weeks as { week_number: number; title?: string; is_completed?: boolean }[]).slice().sort((a, b) => a.week_number - b.week_number);
            const currentWeek = weeks.find((w) => !w.is_completed) ?? weeks[weeks.length - 1];
            if (!currentWeek) return null;
            return (
              <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4 shrink-0" />
                <span>{isAr ? 'الدراسة لـ: ' : 'Study for: '}</span>
                <Link to={dashboardPaths.roadmap} className="font-medium text-foreground underline-offset-4 hover:underline">
                  {isAr ? `الأسبوع ${currentWeek.week_number}` : `Week ${currentWeek.week_number}`} — {currentWeek.title || (isAr ? 'هذا الأسبوع' : 'This week')}
                </Link>
              </p>
            );
          })() : null}
        </motion.div>

        <Card className={cn(
          'overflow-hidden rounded-2xl transition-colors',
          phase === 'work' && 'border-primary/30 bg-primary/5',
          phase === 'short_break' && 'border-success/30 bg-success/5',
          phase === 'long_break' && 'border-accent/30 bg-accent/5'
        )}>
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg font-medium text-muted-foreground">
              {phaseLabel[phase]}
            </CardTitle>
            <CardDescription>
              {phase === 'work' && (isAr ? `الجلسة ${sessionCount + 1}` : `Session ${sessionCount + 1}`)}
              {phase !== 'work' && (isAr ? 'استرح ثم عد للتركيز' : 'Rest, then back to focus')}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center pb-8">
            <div className="text-5xl font-mono font-bold tabular-nums tracking-tight sm:text-6xl md:text-7xl">
              {formatTime(secondsLeft)}
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:mt-8">
              <Button
                size="lg"
                className="min-touch gap-2"
                onClick={() => setIsRunning(true)}
                disabled={isRunning}
              >
                <Play className="h-5 w-5" />
                {isAr ? 'ابدأ' : 'Start'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="min-touch gap-2"
                onClick={() => setIsRunning(false)}
                disabled={!isRunning}
              >
                <Pause className="h-5 w-5" />
                {isAr ? 'إيقاف' : 'Pause'}
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="min-touch gap-2"
                onClick={() => {
                  setIsRunning(false);
                  resetTimer('work');
                  setSessionCount(0);
                }}
              >
                <RotateCcw className="h-5 w-5" />
                {isAr ? 'إعادة تعيين' : 'Reset'}
              </Button>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="mt-6 gap-2">
                  <Settings2 className="h-4 w-4" />
                  {isAr ? 'الإعدادات' : 'Settings'}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md" aria-describedby="pomodoro-settings-desc">
                <DialogHeader>
                  <DialogTitle>{isAr ? 'إعدادات بومودورو' : 'Pomodoro settings'}</DialogTitle>
                  <DialogDescription id="pomodoro-settings-desc">
                    {isAr ? 'اضبط مدة العمل والاستراحات' : 'Set work and break durations'}
                  </DialogDescription>
                </DialogHeader>
                <PomodoroSettingsForm
                  settings={settings}
                  onSave={handleSettingsSave}
                  isAr={isAr}
                />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isAr ? 'اختصار: Ctrl+B أو Cmd+B لإظهار/إخفاء الشريط الجانبي' : 'Tip: Ctrl+B or Cmd+B to toggle the sidebar for a full-width focus.'}
        </p>
      </div>
    </>
  );
}

function PomodoroSettingsForm({
  settings,
  onSave,
  isAr,
}: {
  settings: typeof defaultSettings;
  onSave: (s: typeof defaultSettings) => void;
  isAr: boolean;
}) {
  const [work, setWork] = useState(String(settings.workMinutes));
  const [shortBreak, setShortBreak] = useState(String(settings.shortBreakMinutes));
  const [longBreak, setLongBreak] = useState(String(settings.longBreakMinutes));
  const [sessions, setSessions] = useState(String(settings.sessionsBeforeLongBreak));
  const [soundOnPhaseChange, setSoundOnPhaseChange] = useState(settings.soundOnPhaseChange);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const workMinutes = Math.min(60, Math.max(1, parseInt(work, 10) || 25));
    const shortBreakMinutes = Math.min(30, Math.max(1, parseInt(shortBreak, 10) || 5));
    const longBreakMinutes = Math.min(45, Math.max(1, parseInt(longBreak, 10) || 15));
    const sessionsBeforeLongBreak = Math.min(10, Math.max(1, parseInt(sessions, 10) || 4));
    onSave({
      workMinutes,
      shortBreakMinutes,
      longBreakMinutes,
      sessionsBeforeLongBreak,
      soundOnPhaseChange,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-2">
      <div className="grid gap-2">
        <Label htmlFor="work">{isAr ? 'دقائق العمل' : 'Work (minutes)'}</Label>
        <Input
          id="work"
          type="number"
          min={1}
          max={60}
          value={work}
          onChange={(e) => setWork(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="short">{isAr ? 'استراحة قصيرة (دقائق)' : 'Short break (minutes)'}</Label>
        <Input
          id="short"
          type="number"
          min={1}
          max={30}
          value={shortBreak}
          onChange={(e) => setShortBreak(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="long">{isAr ? 'استراحة طويلة (دقائق)' : 'Long break (minutes)'}</Label>
        <Input
          id="long"
          type="number"
          min={1}
          max={45}
          value={longBreak}
          onChange={(e) => setLongBreak(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="sessions">{isAr ? 'جلسات قبل الاستراحة الطويلة' : 'Sessions before long break'}</Label>
        <Input
          id="sessions"
          type="number"
          min={1}
          max={10}
          value={sessions}
          onChange={(e) => setSessions(e.target.value)}
        />
      </div>
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
        <Label htmlFor="sound" className="cursor-pointer flex-1">
          {isAr ? 'صوت عند انتهاء الطور' : 'Sound on phase change'}
        </Label>
        <Switch
          id="sound"
          checked={soundOnPhaseChange}
          onCheckedChange={setSoundOnPhaseChange}
        />
      </div>
      <Button type="submit">{isAr ? 'حفظ' : 'Save'}</Button>
    </form>
  );
}
