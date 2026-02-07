import { useLanguage } from '@/contexts/LanguageContext';

export default function Content() {
  const { language } = useLanguage();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">
        {language === 'ar' ? 'إدارة المحتوى' : 'Content Management'}
      </h1>
      <p className="text-muted-foreground mt-1">
        {language === 'ar' ? 'قريباً' : 'Coming soon.'}
      </p>
    </div>
  );
}
