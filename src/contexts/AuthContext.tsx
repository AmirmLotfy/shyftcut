import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase, hasSupabase } from "@/lib/supabase";
import { setOnUnauthorized, resetUnauthorizedHandled } from "@/lib/api";
import { debugLog, debugError } from "@/lib/debug";
import { captureException } from "@/lib/error-tracking";
import type { User as SupabaseUser, Session as SupabaseSession } from "@supabase/supabase-js";

const STORAGE_KEY = "shyftcut_access_token";

/** Optional session idle timeout (ms). 0 = disabled. Set VITE_SESSION_IDLE_TIMEOUT_MS (e.g. 1800000 for 30 min) to enable. */
const SESSION_IDLE_TIMEOUT_MS = Number(import.meta.env.VITE_SESSION_IDLE_TIMEOUT_MS ?? 0);

export interface AuthMethods {
  has_password: boolean;
  has_google: boolean;
}

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: { display_name?: string };
  auth_methods?: AuthMethods;
}

export interface AuthSession {
  access_token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  isLoading: boolean;
  /** Returns current access token from Supabase (refreshed if needed). Use this for API calls so token is never stale. */
  getAccessToken: () => Promise<string | null>;
  /** Like getAccessToken but forces a session refresh first. Use for checkout/payment flows where 401 is common. */
  getAccessTokenFresh: () => Promise<string | null>;
  /** Update display name in auth user state (e.g. after profile save). */
  updateUserDisplayName: (displayName: string) => void;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signInWithGoogle: () => void;
  resetPasswordForEmail: (email: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Build AuthUser from Supabase user and optional profile display_name. No /api/auth/session. */
function buildAuthUser(supabaseUser: SupabaseUser, profileDisplayName?: string | null): AuthUser {
  const meta = supabaseUser.user_metadata as Record<string, unknown> | undefined;
  const displayName =
    profileDisplayName ??
    (meta?.display_name as string) ??
    (meta?.full_name as string) ??
    (meta?.name as string);
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? undefined,
    user_metadata: displayName ? { display_name: displayName } : undefined,
    auth_methods: undefined,
  };
}

function useAuthState() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useLanguage();

  const persistSession = useCallback((accessToken: string, userData: AuthUser) => {
    try {
      localStorage.setItem(STORAGE_KEY, accessToken);
    } catch {
      // ignore
    }
    setSession({ access_token: accessToken });
    setUser(userData);
    resetUnauthorizedHandled();
  }, []);

  const clearSession = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setSession(null);
    setUser(null);
  }, []);

  const syncSessionFromSupabase = useCallback(
    (supabaseSession: SupabaseSession): void => {
      const accessToken = supabaseSession.access_token;
      if (!accessToken) {
        clearSession();
        return;
      }
      const supabaseUser = supabaseSession.user;
      // Set session immediately so hooks can run with valid session; profile fetch runs in background.
      persistSession(accessToken, buildAuthUser(supabaseUser, null));
      if (supabase?.from) {
        void supabase
          .from("profiles")
          .select("display_name")
          .eq("user_id", supabaseUser.id)
          .maybeSingle()
          .then(({ data: profile }) => {
            const profileDisplayName = profile?.display_name ?? null;
            if (profileDisplayName) {
              setUser(buildAuthUser(supabaseUser, profileDisplayName));
            }
          })
          .catch((err) => {
            debugError("AuthContext", "syncSessionFromSupabase profile fetch", err);
          });
      }
    },
    [persistSession, clearSession]
  );

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!hasSupabase || !supabase) return null;
    const { data: { session: supabaseSession } } = await supabase.auth.getSession();
    if (supabaseSession?.access_token) return supabaseSession.access_token;
    const { data: { session: refreshed } } = await supabase.auth.refreshSession();
    return refreshed?.access_token ?? null;
  }, []);

  const getAccessTokenFresh = useCallback(async (): Promise<string | null> => {
    if (!hasSupabase || !supabase) return null;
    const valid = (t: string | undefined | null) => (t && String(t).trim()) || null;
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) {
        debugError("AuthContext", "getAccessTokenFresh refresh error", error);
        return null;
      }
      const t = valid(session?.access_token);
      if (t) return t;
      // Do NOT fall back to getSession(): it returns cached session which may have
      // an expired access_token. Returning that would cause 401 on API calls.
      return null;
    } catch (err) {
      debugError("AuthContext", "getAccessTokenFresh refresh failed", err);
      return null;
    }
  }, [hasSupabase, supabase]);

  const updateUserDisplayName = useCallback((displayName: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      return { ...prev, user_metadata: { ...prev.user_metadata, display_name: displayName } };
    });
  }, []);

  useEffect(() => {
    if (!hasSupabase || !supabase) {
      setIsLoading(false);
      return;
    }
    const isOAuthCallback =
      typeof window !== "undefined" &&
      window.location.hash &&
      (window.location.hash.includes("access_token=") || window.location.hash.includes("error="));

    if (isOAuthCallback) {
      setIsLoading(true);
      const timeoutId = setTimeout(() => setIsLoading(false), 8000);
      const {
        data: { subscription },
      } =       supabase.auth.onAuthStateChange((_event, supabaseSession) => {
        if (supabaseSession) {
          syncSessionFromSupabase(supabaseSession);
          setIsLoading(false);
        } else {
          clearSession();
          setIsLoading(false);
        }
      });
      void supabase.auth.getSession();
      return () => {
        clearTimeout(timeoutId);
        subscription.unsubscribe();
      };
    }

    supabase.auth.getSession().then(({ data: { session: supabaseSession } }) => {
      if (supabaseSession) {
        syncSessionFromSupabase(supabaseSession);
        setIsLoading(false);
      } else {
        clearSession();
        setIsLoading(false);
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, supabaseSession) => {
      if (supabaseSession) {
        syncSessionFromSupabase(supabaseSession);
      } else {
        clearSession();
      }
    });
    return () => subscription.unsubscribe();
  }, [clearSession, syncSessionFromSupabase]);

  useEffect(() => {
    setOnUnauthorized(() => {
      clearSession();
      const goToLogin = () => {
        window.location.href = "/login?expired=1";
      };
      if (supabase) {
        supabase.auth.signOut().then(goToLogin).catch(goToLogin);
      } else {
        goToLogin();
      }
    });
    return () => setOnUnauthorized(null);
  }, [clearSession]);

  const signUp = async (email: string, password: string, displayName?: string) => {
    if (!supabase) {
      toast({
        title: "Auth not configured",
        description: "Supabase is not configured.",
        variant: "destructive",
      });
      throw new Error("Auth not configured");
    }
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: displayName?.trim() },
        emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/login` : undefined,
      },
    });
    if (error) {
      debugLog("AuthContext", "signUp error", error.message);
      captureException(error);
      const code = (error as { code?: string }).code;
      const isPasswordError =
        code === "weak_password" || /password|weak|security/i.test(error.message);
      const isAlreadyRegistered =
        code === "email_exists" ||
        code === "identity_already_exists" ||
        /already registered|user already exists|email already in use|already in use/i.test(
          error.message
        );
      toast({
        title: "Sign up failed",
        description: isPasswordError
            ? t("auth.passwordWeak")
            : isAlreadyRegistered
              ? t("auth.emailAlreadyRegistered")
              : error.message,
        variant: "destructive",
      });
      throw new Error(error.message);
    }
    // Supabase returns success with empty identities when email already exists (e.g. from Google OAuth)
    const existingEmail =
      data.user &&
      Array.isArray((data.user as { identities?: unknown[] }).identities) &&
      (data.user as { identities: unknown[] }).identities.length === 0;
    if (existingEmail) {
      toast({
        title: "Account already exists",
        description: t("auth.emailAlreadyRegistered"),
        variant: "destructive",
      });
      throw new Error("Email already registered");
    }
    if (data.session) {
      syncSessionFromSupabase(data.session);
      toast({
        title: "Account created!",
        description: "Welcome to Shyftcut. Let's build your roadmap!",
      });
    } else {
      toast({
        title: "Check your email",
        description: "Confirm your email to sign in.",
      });
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      toast({
        title: "Auth not configured",
        description: "Supabase is not configured.",
        variant: "destructive",
      });
      throw new Error("Auth not configured");
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      debugLog("AuthContext", "signIn error", error.message);
      captureException(error);
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
      throw new Error(error.message);
    }
    if (data.session) {
      syncSessionFromSupabase(data.session);
      toast({
        title: "Welcome back!",
        description: "You are now signed in.",
      });
    }
  };

  const signInWithMagicLink = useCallback(
    async (email: string) => {
      if (!supabase) {
        toast({
          title: "Auth not configured",
          description: "Supabase is not configured.",
          variant: "destructive",
        });
        throw new Error("Auth not configured");
      }
      const redirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/login` : undefined;
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectTo,
        },
      });
      if (error) {
        debugLog("AuthContext", "signInWithMagicLink error", error.message);
        captureException(error);
        toast({
          title: t("auth.magicLink.failed"),
          description: `${error.message} ${t("auth.magicLink.tryGoogle")}`,
          variant: "destructive",
        });
        throw new Error(error.message);
      }
      toast({
        title: t("auth.magicLink.success"),
        description: t("auth.magicLink.successDesc"),
      });
    },
    [toast, t]
  );

  const signInWithGoogle = useCallback(() => {
    if (!supabase) {
      toast({
        title: "Auth not configured",
        description: "Supabase is not configured.",
        variant: "destructive",
      });
      return;
    }
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + window.location.pathname },
    });
  }, [toast]);

  const resetPasswordForEmail = useCallback(
    async (email: string) => {
      if (!supabase) {
        toast({
          title: "Auth not configured",
          description: "Supabase is not configured.",
          variant: "destructive",
        });
        throw new Error("Auth not configured");
      }
      const redirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });
      if (error) {
        debugLog("AuthContext", "resetPasswordForEmail error", error.message);
        toast({
          title: "Failed to send reset email",
          description: error.message,
          variant: "destructive",
        });
        throw new Error(error.message);
      }
      toast({
        title: t("auth.forgotPasswordSuccess"),
        description: t("auth.forgotPasswordSuccessDesc"),
      });
    },
    [toast, t]
  );

  const signOut = useCallback(() => {
    if (supabase) supabase.auth.signOut();
    clearSession();
    toast({
      title: "Signed out",
      description: "See you next time!",
    });
  }, [clearSession, toast]);

  // Optional: sign out after inactivity when SESSION_IDLE_TIMEOUT_MS > 0
  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetIdleTimer = useCallback(() => {
    if (SESSION_IDLE_TIMEOUT_MS <= 0 || !user) return;
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    idleTimeoutRef.current = setTimeout(() => {
      signOut();
      idleTimeoutRef.current = null;
    }, SESSION_IDLE_TIMEOUT_MS);
  }, [user, signOut]);

  useEffect(() => {
    if (SESSION_IDLE_TIMEOUT_MS <= 0 || !user) return;
    resetIdleTimer();
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetIdleTimer));
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdleTimer));
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    };
  }, [user, resetIdleTimer]);

  return {
    user,
    session,
    isLoading,
    getAccessToken,
    getAccessTokenFresh,
    updateUserDisplayName,
    signUp,
    signIn,
    signInWithMagicLink,
    signInWithGoogle,
    resetPasswordForEmail,
    signOut,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const state = useAuthState();
  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        session: state.session,
        isLoading: state.isLoading,
        getAccessToken: state.getAccessToken,
        getAccessTokenFresh: state.getAccessTokenFresh,
        updateUserDisplayName: state.updateUserDisplayName,
        signUp: state.signUp,
        signIn: state.signIn,
        signInWithMagicLink: state.signInWithMagicLink,
        signInWithGoogle: state.signInWithGoogle,
        resetPasswordForEmail: state.resetPasswordForEmail,
        signOut: state.signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
