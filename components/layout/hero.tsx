"use client";
import { BackgroundGradientAnimation } from "../ui/background-gradient-animation";
import { STORE_CONFIG } from "@/lib/config";

export default function Hero() {
  return (
    <BackgroundGradientAnimation>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 space-y-2">
        <h1 className="text-5xl text-white text-center font-semibold tracking-wider">
          {STORE_CONFIG.name}
        </h1>
        <h2 className="text-2xl text-center font-medium text-muted/50 tracking-wider">
          {STORE_CONFIG.subtitle}
        </h2>
      </div>
    </BackgroundGradientAnimation>
  );
}
