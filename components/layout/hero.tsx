"use client";

import { motion } from "motion/react";
import { BackgroundGradientAnimation } from "../ui/background-gradient-animation";
import { STORE_CONFIG } from "@/lib/config";

export default function Hero() {
  return (
    <BackgroundGradientAnimation>
      <section className="w-full h-svh absolute top-0 left-0 right-0 z-10 overflow-hidden pointer-events-none select-none">
        {/* SUBTITLE */}
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
            <path
              d="M50 20 L20 80 L80 80 Z"
              fill="none"
              stroke="currentColor"
              stroke-width="5"
              className="text-foreground"
            />
          </svg>
        </div>
        {/* SINCE */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(15px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="absolute top-1/2 -translate-y-1/2 right-4 flex flex-col items-center justify-center gap-2 text-xs md:text-sm"
        >
          <p className="text-foreground/70 font-light [writing-mode:vertical-rl]">
            since
          </p>
          <h4 className="flex flex-col items-center justify-center">
            {Array.from(String(STORE_CONFIG.since), (digit, index) => (
              <span
                key={index}
                className="text-foreground font-bold leading-none"
              >
                {digit}
              </span>
            ))}
          </h4>
        </motion.div>
        {/* CATCHPHRASE */}
        <motion.h3
          initial={{ opacity: 0, y: 20, filter: "blur(15px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="absolute bottom-4 left-4 text-sm md:text-base font-light tracking-wider"
        >
          {STORE_CONFIG.catchphrase}
        </motion.h3>
        {/* TITLE */}
        <motion.h2
          initial={{ opacity: 0, y: 20, filter: "blur(15px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="absolute bottom-4 right-4 text-3xl md:text-4xl font-semibold tracking-wider [writing-mode:vertical-rl]"
        >
          {STORE_CONFIG.name}
        </motion.h2>
      </section>
    </BackgroundGradientAnimation>
  );
}
