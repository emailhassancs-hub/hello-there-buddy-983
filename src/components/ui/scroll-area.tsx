import * as React from "react";
import { cn } from "@/lib/utils";

// Lightweight, stateless ScrollArea to avoid Radix ref/state loops
const ScrollArea = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("relative overflow-auto", className)}
      {...props}
    >
      {children}
    </div>
  )
);
ScrollArea.displayName = "ScrollArea";

// No-op ScrollBar to preserve API where used
const ScrollBar: React.FC<{ orientation?: "vertical" | "horizontal"; className?: string } & React.HTMLAttributes<HTMLDivElement>> = () => null;

export { ScrollArea, ScrollBar };
