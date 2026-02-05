import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { getUpgradePath } from '@/lib/upgrade-link';

export default function CheckoutCancel() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const upgradePath = getUpgradePath(user);

  return (
    <Layout>
      <div className="container mx-auto flex min-h-[80vh] items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border-muted">
            <CardHeader className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted"
              >
                <XCircle className="h-10 w-10 text-muted-foreground" />
              </motion.div>
              <CardTitle className="text-2xl">
                {t('checkout.cancel.title')}
              </CardTitle>
              <CardDescription className="text-base">
                {t('checkout.cancel.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => navigate(upgradePath)} 
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4 rtl:mr-0 rtl:ml-2" />
                {user ? t('checkout.cancel.backToUpgrade') : t('checkout.cancel.backToPricing')}
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigate('/dashboard')} 
                className="w-full"
              >
                {t('checkout.cancel.continueFree')}
              </Button>
              
              <p className="text-center text-xs text-muted-foreground">
                {t('checkout.cancel.supportText')}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
