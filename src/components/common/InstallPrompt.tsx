import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const DISMISS_KEY = "shyftcut-install-dismissed";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/** True when we are on a route where we render the install banner and can call .prompt(). */
function canShowBanner(pathname: string): boolean {
  return pathname.startsWith("/dashboard") || pathname.startsWith("/wizard");
}

export function InstallPrompt() {
  const { language } = useLanguage();
  const { pathname } = useLocation();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;
    if (isStandalone()) return;

    setDismissed(false);

    const handler = (e: Event) => {
      // Capture the event so we can call .prompt() later. Do not call preventDefault() unless we
      // are certain we will show our banner and the user can tap Install (avoids "prompt() never called").
      const onBannerRoute = canShowBanner(pathnameRef.current);
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (onBannerRoute) {
        e.preventDefault();
        setVisible(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    if (isIOS()) {
      setVisible(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (canShowBanner(pathname) && deferredPrompt && !dismissed) setVisible(true);
  }, [pathname, deferredPrompt, dismissed]);

  if (!canShowBanner(pathname)) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setVisible(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, "true");
  };

  if (!visible || dismissed) return null;

  const isIOSDevice = isIOS();
  const showInstallButton = !isIOSDevice && deferredPrompt;

  const copy = {
    en: {
      install: "Install app",
      iosHint: "Tap Share, then Add to Home Screen",
      dismiss: "Not now",
    },
    ar: {
      install: "تثبيت التطبيق",
      iosHint: "اضغط مشاركة، ثم إضافة إلى الشاشة الرئيسية",
      dismiss: "ليس الآن",
    },
  };
  const t = copy[language];

  return (
    <div
      role="region"
      aria-label={language === "ar" ? "تثبيت التطبيق" : "Install app"}
      className="fixed bottom-20 left-4 right-4 z-40 rounded-lg border border-border bg-background/95 p-3 shadow-lg backdrop-blur sm:left-auto sm:right-4 sm:max-w-sm rtl:sm:left-4 rtl:sm:right-auto"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {showInstallButton ? (
            <p className="text-sm font-medium text-foreground">
              {language === "ar" ? "ثبّت Shyftcut على جهازك للوصول السريع." : "Install Shyftcut on your device for quick access."}
            </p>
          ) : isIOSDevice ? (
            <p className="text-sm text-foreground">{t.iosHint}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {showInstallButton && (
              <Button size="sm" onClick={handleInstall} className="gap-1.5">
                <Download className="h-4 w-4" />
                {t.install}
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              {t.dismiss}
            </Button>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={handleDismiss}
          aria-label={language === "ar" ? "إغلاق" : "Close"}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
