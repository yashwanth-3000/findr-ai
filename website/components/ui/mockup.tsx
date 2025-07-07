"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MockupFrameProps {
  size?: "small" | "medium" | "large";
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

interface MockupProps {
  type?: "browser" | "responsive" | "window";
  children: ReactNode;
  className?: string;
}

export function MockupFrame({
  size = "medium",
  children,
  className,
  style,
}: MockupFrameProps) {
  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden border border-border/40 shadow-lg bg-card",
        "transition-all duration-300 relative",
        size === "small" && "max-w-[90%] sm:max-w-[80%]",
        size === "medium" && "max-w-[95%] sm:max-w-[90%]",
        size === "large" && "max-w-full",
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}

export function Mockup({ type = "responsive", children, className }: MockupProps) {
  return (
    <div
      className={cn(
        "overflow-hidden relative",
        (type === "browser" || type === "window") &&
          "pt-8 before:content-[''] before:absolute before:left-4 before:top-[14px] before:w-2 before:h-2 before:rounded-full before:bg-red-400 before:shadow-[16px_0_0_#fbbf24,32px_0_0_#22c55e]",
        type === "browser" &&
          "before:shadow-[16px_0_0_#fbbf24,32px_0_0_#22c55e,0_-8px_0_0_#e5e7eb_inset] before:w-full before:h-6 before:left-0 before:rounded-none",
        className
      )}
    >
      {children}
    </div>
  );
} 