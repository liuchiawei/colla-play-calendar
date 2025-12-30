"use client";

import { motion } from "motion/react";
import { BackgroundGradientAnimation } from "../ui/background-gradient-animation";
import { STORE_CONFIG } from "@/lib/config";

export default function Hero() {
  return (
    <BackgroundGradientAnimation>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 space-y-4">
        <motion.h1
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl text-white text-center font-semibold tracking-wider text-shadow-lg"
        >
          {STORE_CONFIG.name}
        </motion.h1>
        <motion.h2
          initial={{ opacity: 0, y: 20, filter: "blur(15px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-xl text-center font-semilight text-muted/70 tracking-widest text-shadow-md"
        >
          {STORE_CONFIG.subtitle}
        </motion.h2>
      </div>
    </BackgroundGradientAnimation>
  );
}
