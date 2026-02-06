import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, Zap, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { getUpgradePath } from '@/lib/upgrade-link';
import { getBenefitLabel } from '@/lib/premium-features';
import type { UpgradePromptFeature } from '@/lib/premium-features';

interface UpgradePromptProps {
  feature: UpgradePromptFeature;
  remaining?: number;
  limit?: number;
}

export function UpgradePrompt({ feature, remaining, limit }: UpgradePromptProps) {
  const { language } = useLanguage();
  const { user } = useAuth();

  const content = {
    roadmap: {
      en: {
        title: 'Roadmap Limit Reached',
        description: "You've used your free roadmap. Upgrade to Premium for unlimited roadmaps and unlock your full career potential.",
        icon: Lock,
      },
      ar: {
        title: 'تم الوصول لحد خرائط الطريق',
        description: 'لقد استخدمت خريطة الطريق المجانية. قم بالترقية للحصول على خرائط طريق غير محدودة.',
        icon: Lock,
      },
    },
    chat: {
      en: {
        title: 'Chat Limit Reached',
        description: `You've used ${limit || 10} free messages this month. Upgrade for unlimited AI coaching.`,
        icon: Zap,
      },
      ar: {
        title: 'تم الوصول لحد الرسائل',
        description: `لقد استخدمت ${limit || 10} رسائل مجانية هذا الشهر. قم بالترقية للحصول على محادثات غير محدودة.`,
        icon: Zap,
      },
    },
    quiz: {
      en: {
        title: 'Premium Feature',
        description: 'Weekly quizzes are available for Premium subscribers. Upgrade to test your knowledge!',
        icon: Crown,
      },
      ar: {
        title: 'ميزة مميزة',
        description: 'الاختبارات الأسبوعية متاحة لمشتركي بريميوم. قم بالترقية لاختبار معرفتك!',
        icon: Crown,
      },
    },
    notes: {
      en: {
        title: 'Notes Limit Reached',
        description: "You've reached your free notes limit. Upgrade for unlimited notes across all roadmap weeks.",
        icon: Lock,
      },
      ar: {
        title: 'تم الوصول لحد الملاحظات',
        description: 'لقد وصلت لحد الملاحظات المجانية. قم بالترقية للحصول على ملاحظات غير محدودة.',
        icon: Lock,
      },
    },
    tasks: {
      en: {
        title: 'Tasks Limit Reached',
        description: "You've reached your free tasks limit. Upgrade for unlimited tasks.",
        icon: Lock,
      },
      ar: {
        title: 'تم الوصول لحد المهام',
        description: 'لقد وصلت لحد المهام المجانية. قم بالترقية للحصول على مهام غير محدودة.',
        icon: Lock,
      },
    },
    ai_suggestions: {
      en: {
        title: 'Daily AI Suggestions Limit',
        description: "You've used your free AI task suggestions for today. Upgrade for unlimited daily suggestions.",
        icon: Zap,
      },
      ar: {
        title: 'حد اقتراحات الذكاء الاصطناعي اليومية',
        description: 'لقد استخدمت اقتراحات المهام المجانية لليوم. قم بالترقية للحصول على اقتراحات يومية غير محدودة.',
        icon: Zap,
      },
    },
  };

  const lang = language === 'ar' ? 'ar' : 'en';
  const currentContent = content[feature][lang];
  const Icon = currentContent.icon;
  const benefitLabel = getBenefitLabel(feature, lang);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="dashboard-card border-primary/20 bg-gradient-to-b from-primary/5 via-primary/[0.02] to-transparent">
        <CardHeader className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25"
          >
            <Icon className="h-8 w-8 text-white" />
          </motion.div>
          <CardTitle className="text-xl">{currentContent.title}</CardTitle>
          <CardDescription className="text-base">
            {currentContent.description}
          </CardDescription>
          <p className="mt-2 text-sm font-medium text-primary">
            {language === 'ar' ? `مع بريميوم: ${benefitLabel}` : `With Premium: ${benefitLabel}`}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {remaining !== undefined && limit !== undefined && (
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-sm text-muted-foreground">
                {language === 'ar' 
                  ? `${remaining} من ${limit} متبقي` 
                  : `${remaining} of ${limit} remaining`}
              </p>
            </div>
          )}
          
          <Button asChild className="w-full btn-glow">
            <Link to={getUpgradePath(user)}>
              <Crown className="mr-2 h-4 w-4 rtl:mr-0 rtl:ml-2" />
              {language === 'ar' ? 'ترقية الآن' : 'Upgrade Now'}
            </Link>
          </Button>
          
          <p className="text-center text-xs text-muted-foreground">
            {language === 'ar'
              ? 'ابدأ بـ $6.99/شهر أو $59/سنة (وفر 30% مع السنوي)'
              : 'From $6.99/month or $59/year — Save 30% with yearly'}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
