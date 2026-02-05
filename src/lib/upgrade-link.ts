/**
 * Central place for "upgrade" destination: logged-in users go to in-app /upgrade,
 * others go to public /pricing. Use for all Upgrade CTAs so the system keeps
 * authenticated users inside the app flow.
 */
import type { AuthUser } from "@/contexts/AuthContext";

export function getUpgradePath(user: AuthUser | null): string {
  return user ? "/upgrade" : "/pricing";
}
