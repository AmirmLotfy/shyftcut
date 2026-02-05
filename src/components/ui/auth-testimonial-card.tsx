import * as React from "react";
import { cn } from "@/lib/utils";

export interface AuthTestimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface AuthTestimonialCardProps {
  testimonial: AuthTestimonial;
  delay?: string;
  className?: string;
}

export function AuthTestimonialCard({
  testimonial,
  delay = "",
  className,
}: AuthTestimonialCardProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-3xl bg-card/40 dark:bg-zinc-800/40 backdrop-blur-xl border border-white/10 p-5 w-64",
        delay && "animate-testimonial " + delay,
        className
      )}
    >
      <img
        src={testimonial.avatarSrc}
        className="h-10 w-10 object-cover rounded-2xl"
        alt=""
        loading="lazy"
        decoding="async"
      />
      <div className="text-sm leading-snug">
        <p className="flex items-center gap-1 font-medium">{testimonial.name}</p>
        <p className="text-muted-foreground">{testimonial.handle}</p>
        <p className="mt-1 text-foreground/80">{testimonial.text}</p>
      </div>
    </div>
  );
}
