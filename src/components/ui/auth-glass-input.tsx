import * as React from "react";
import { cn } from "@/lib/utils";

export interface GlassInputWrapperProps {
  children: React.ReactNode;
  className?: string;
}

/** Glass-morphism input wrapper with focus states for auth forms. */
export const GlassInputWrapper = React.forwardRef<
  HTMLDivElement,
  GlassInputWrapperProps
>(({ children, className }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl border border-border bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-primary/70 focus-within:bg-primary/5",
      className
    )}
  >
    {children}
  </div>
));
GlassInputWrapper.displayName = "GlassInputWrapper";
