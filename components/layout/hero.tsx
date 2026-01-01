"use client";

import { motion } from "motion/react";
import { BackgroundGradientAnimation } from "../ui/background-gradient-animation";
import { STORE_CONFIG } from "@/lib/config";

export default function Hero() {
  return (
    <BackgroundGradientAnimation>
      <header className="w-full h-svh absolute top-0 left-0 right-0 z-10 overflow-hidden pointer-events-none select-none">
        <motion.h1
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="absolute top-4 left-2 text-4xl md:text-5xl text-foreground font-semibold tracking-[3vh] leading-12 md:leading-16 [writing-mode:vertical-lr]"
        >
          {STORE_CONFIG.subtitle.slice(0, 5)}
          <br />
          {STORE_CONFIG.subtitle.slice(5)}
        </motion.h1>
        {/* LOGO */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <svg
            width="100"
            height="100"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M50 20 L20 80 L80 80 Z" fill="none" stroke="currentColor" stroke-width="5" className="text-foreground" />
          </svg>
        </div>
        <motion.h2
          initial={{ opacity: 0, y: 20, filter: "blur(15px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="absolute bottom-4 right-2 text-3xl md:text-4xl font-semibold text-foreground tracking-wider [writing-mode:vertical-lr]"
        >
          {STORE_CONFIG.name}
        </motion.h2>
      </header>
    </BackgroundGradientAnimation>
  );
}
