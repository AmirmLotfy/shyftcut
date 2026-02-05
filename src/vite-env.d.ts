/// <reference types="vite/client" />

/** PWA install prompt (non-standard; Chrome/Android). */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}
