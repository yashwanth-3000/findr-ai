"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface GlowProps {
  variant?: "top" | "bottom" | "left" | "right" | "center";
  className?: string;
  style?: React.CSSProperties;
  intensity?: "low" | "medium" | "high";
  size?: "sm" | "md" | "lg" | "xl";
  color?: string;
}

export function Glow({
  variant = "center",
  className,
  style,
  intensity = "medium",
  size = "md",
  color,
}: GlowProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const intensityValues = {
    low: "opacity-20",
    medium: "opacity-30",
    high: "opacity-40",
  };

  const sizeValues = {
    sm: "w-32 h-32",
    md: "w-64 h-64",
    lg: "w-96 h-96",
    xl: "w-[32rem] h-[32rem]",
  };

  const positions = {
    top: "-top-1/2 left-1/2 -translate-x-1/2",
    bottom: "-bottom-1/2 left-1/2 -translate-x-1/2",
    left: "top-1/2 -left-1/2 -translate-y-1/2",
    right: "top-1/2 -right-1/2 -translate-y-1/2",
    center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  };

  return (
    <div
      className={cn(
        "absolute pointer-events-none",
        positions[variant],
        sizeValues[size],
        intensityValues[intensity],
        "bg-gradient-radial from-brand to-transparent blur-2xl",
        "z-0",
        className
      )}
      style={{
        ...(color ? { background: `radial-gradient(circle, ${color} 0%, transparent 70%)` } : {}),
        ...style,
      }}
    />
  );
} 