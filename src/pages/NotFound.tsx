import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NotFound() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="fixed inset-0 mesh-gradient" />
      <div className="fixed inset-0 bg-gradient-to-b from-transparent to-background" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative text-center"
      >
        <h1 className="mb-4 text-9xl font-bold gradient-text">404</h1>
        <h2 className="mb-4 text-2xl font-semibold">
          {t('notfound.title')}
        </h2>
        <p className="mb-8 text-muted-foreground">
          {t('notfound.description')}
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('notfound.goBack')}
          </Button>
          <Button asChild className="btn-glow gap-2">
            <Link to="/">
              <Home className="h-4 w-4" />
              {t('notfound.home')}
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
