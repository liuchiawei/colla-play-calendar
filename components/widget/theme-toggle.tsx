"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "motion/react";
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
      asChild
    >
      <motion.button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? "switch to light mode" : "switch to dark mode"}
        whileTap={{ scale: 0.94 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <span className="sr-only">
          {isDark ? "切換為淺色模式" : "切換為深色模式"}
        </span>

          {isDark ? (
            <motion.span
              key="moon"
              initial={{ opacity: 0, y: 5, rotate: -90, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 500,
              }}
              className="inline-flex"
            >
              <Moon className="size-4" />
            </motion.span>
          ) : (
            <motion.span
              key="sun"
              initial={{ opacity: 0, y: 5, rotate: -90, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 500,
              }}
              className="inline-flex"
            >
              <Sun className="size-4" />
            </motion.span>
          )}
      </motion.button>
    </Button>
  );
}
