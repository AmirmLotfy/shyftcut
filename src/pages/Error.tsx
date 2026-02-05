import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, AlertTriangle, RefreshCw, MessageSquare, HelpCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

interface ErrorPageProps {
  error?: Error;
  resetError?: () => void;
}

export default function Error({ error, resetError }: ErrorPageProps) {
  const { t } = useLanguage();

  const handleRefresh = () => {
    if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  };

  const quickLinks = [
    { to: '/', label: t('nav.home'), icon: Home },
    { to: '/dashboard', label: t('nav.dashboard'), icon: HelpCircle },
    { to: '/contact', label: t('contact.title'), icon: MessageSquare },
  ];

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Background */}
      <div className="absolute inset-0 mesh-gradient" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background" />
      
      {/* Floating orbs */}
      <div className="absolute left-[10%] top-[20%] h-64 w-64 rounded-full bg-destructive/20 blur-[100px] animate-float" />
      <div className="absolute right-[10%] bottom-[20%] h-48 w-48 rounded-full bg-primary/20 blur-[80px] animate-float" style={{ animationDelay: '-3s' }} />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mx-auto max-w-lg text-center"
      >
        {/* Error Icon */}
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.1 }}
          className="mx-auto mb-8"
        >
          <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-destructive/20 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-destructive/30 to-destructive/10 backdrop-blur-sm">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
          </div>
        </motion.div>
        
        {/* Error Text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-destructive">
            {t('common.errorTitle')}
          </p>
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">
            {t('error.title')}
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            {t('error.description')}
          </p>
        </motion.div>

        {/* Error Details (Dev only) */}
        {error && process.env.NODE_ENV === 'development' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-8 overflow-hidden rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-left"
          >
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-destructive/80">
              Error Details (Development Only)
            </p>
            <p className="font-mono text-sm text-destructive">{error.message}</p>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button 
            variant="outline" 
            onClick={() => window.history.back()} 
            className="w-full gap-2 sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('error.goBack')}
          </Button>
          <Button 
            variant="secondary" 
            onClick={handleRefresh} 
            className="w-full gap-2 sm:w-auto"
          >
            <RefreshCw className="h-4 w-4" />
            {t('error.tryAgain')}
          </Button>
          <Button asChild className="btn-glow w-full gap-2 sm:w-auto">
            <Link to="/">
              <Home className="h-4 w-4" />
              {t('nav.home')}
            </Link>
          </Button>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="mb-4 text-sm text-muted-foreground">
            {t('error.quickLinks')}
          </p>
          <div className="grid grid-cols-3 gap-3">
            {quickLinks.map((link) => (
              <Link key={link.to} to={link.to}>
                <Card className="public-glass-card transition-all">
                  <CardContent className="flex flex-col items-center gap-2 p-4">
                    <link.icon className="h-5 w-5 text-primary" />
                    <span className="text-xs font-medium">{link.label}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Support */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-sm text-muted-foreground"
        >
          {t('error.needHelp')}{' '}
          <a href="mailto:support@shyftcut.com" className="inline-flex items-center gap-1 text-primary hover:underline">
            <Mail className="h-3 w-3" />
            support@shyftcut.com
          </a>
        </motion.p>
      </motion.div>
    </div>
  );
}
