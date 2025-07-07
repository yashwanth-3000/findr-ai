import { cn } from "@/lib/utils";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  fluid?: boolean;
}

/**
 * A consistent container component to apply standard padding and max-width across the site
 */
export function Container({ children, className, fluid = false }: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-6 sm:px-8 md:px-12", // increased horizontal padding
        {
          "max-w-7xl": !fluid, // constrained width for regular content
        },
        className
      )}
    >
      {children}
    </div>
  );
} 