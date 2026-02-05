import { useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import type { HCaptcha as HCaptchaRef } from '@hcaptcha/react-hcaptcha';

const SITE_KEY = (import.meta.env.VITE_HCAPTCHA_SITE_KEY as string | undefined)?.trim() || undefined;
const E2E_MODE = ['true', '1'].includes(String(import.meta.env.VITE_E2E ?? '').toLowerCase());

export const HCAPTCHA_ENABLED = Boolean(SITE_KEY) && !E2E_MODE;

export interface AuthCaptchaRef {
  reset: () => void;
}

export const AuthCaptcha = forwardRef<AuthCaptchaRef, {
  onVerify: (token: string) => void;
  onExpire?: () => void;
}>(({ onVerify, onExpire }, ref) => {
  const captchaRef = useRef<HCaptchaRef>(null);

  const reset = useCallback(() => {
    captchaRef.current?.resetCaptcha();
  }, []);

  useImperativeHandle(ref, () => ({ reset }), [reset]);

  if (!HCAPTCHA_ENABLED) return null;

  return (
    <div className="flex justify-center">
      <HCaptcha
        ref={captchaRef}
        sitekey={SITE_KEY!}
        onVerify={onVerify}
        onExpire={onExpire}
      />
    </div>
  );
});

AuthCaptcha.displayName = 'AuthCaptcha';
