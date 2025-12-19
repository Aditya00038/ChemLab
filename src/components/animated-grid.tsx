"use client";

import { cn } from "@/lib/utils";

export function AnimatedGrid() {
  return (
    <div
      className={cn(
        "absolute inset-0 z-0 h-full w-full",
        // use CSS hsl var with alpha instead of theme() inside arbitrary value
        "[background-image:radial-gradient(hsl(var(--primary)/0.1)_1px,transparent_1px)]",
        "bg-[length:2rem_2rem]",
        "bg-[position:0%_0%]",
        "animate-[animated-grid_30s_linear_infinite]",
        "dark:[background-image:radial-gradient(hsl(var(--primary)/0.1)_1px,transparent_1px)]",
      )}
    >
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-background/10 via-background/80 to-background" />
    </div>
  );
}