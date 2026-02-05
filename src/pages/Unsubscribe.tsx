import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { apiPath, apiHeaders } from '@/lib/api';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!token?.trim()) {
      setStatus('error');
      return;
    }
    setStatus('loading');
    const path = '/api/unsubscribe-email';
    const url = `${apiPath(path)}?${new URLSearchParams({ path, token: token.trim() }).toString()}`;
    fetch(url, { method: 'GET', headers: apiHeaders(path) })
      .then((res) => {
        if (res.ok) setStatus('success');
        else setStatus('error');
      })
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <Layout>
      <div className="container mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 py-16">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Unsubscribing…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 text-green-600" />
            <h1 className="mt-4 text-xl font-semibold">You're unsubscribed</h1>
            <p className="mt-2 text-center text-muted-foreground">
              Study reminder emails are turned off. You can turn them back on in Profile → Study reminders.
            </p>
            <Button asChild className="mt-6">
              <Link to="/">Go to Shyftcut</Link>
            </Button>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 text-destructive" />
            <h1 className="mt-4 text-xl font-semibold">Invalid or expired link</h1>
            <p className="mt-2 text-center text-muted-foreground">
              This unsubscribe link is invalid or was already used.
            </p>
            <Button asChild variant="outline" className="mt-6">
              <Link to="/">Go to Shyftcut</Link>
            </Button>
          </>
        )}
      </div>
    </Layout>
  );
}
