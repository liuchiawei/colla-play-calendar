"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  // Avoid hydration mismatch: on the server + first client render, keep it stable.
  const isDark = mounted ? resolvedTheme === "dark" : false;

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("relative rounded-full overflow-hidden", className)}
      onClick={toggleTheme}
      aria-label={isDark ? "switch to light mode" : "switch to dark mode"}
    >
      {isDark ? (
        <span key="moon" className="inline-flex">
          <Moon className="size-4" />
        </span>
      ) : (
        <span key="sun" className="inline-flex">
          <Sun className="size-4" />
        </span>
      )}
    </Button>
  );
}
