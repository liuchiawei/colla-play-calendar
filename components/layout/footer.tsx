"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { STORE_CONFIG, PAGE_LINKS, SOCIAL_LINKS } from "@/lib/config";
import Link from "next/link";
import GlassSurface from "@/components/ui/glass-surface";
import {
  MapPin,
  Mail,
  Phone,
  Clock,
  Instagram,
  Facebook,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";

// アイコンマッピング（設定ファイルの文字列をコンポーネントに変換）
const iconMap: Record<string, LucideIcon> = {
  Instagram,
  Facebook,
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="p-4">
      <div className="px-4 py-8 glass-surface shadow-sm rounded-2xl">
        <div className="w-full flex gap-4 mb-4">
          {/* Social Links */}
          <div className="space-x-10 text-sm">
            <h3 className="text-sm font-semibold [writing-mode:vertical-lr]">
              Follow Us
            </h3>
            <div className="flex flex-col gap-2">
              {SOCIAL_LINKS.map((social) => {
                return (
                  <Button
                    key={social.label}
                    size="icon"
                    className="size-6 rounded-full"
                    asChild
                  >
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                    >
                      <social.icon className="size-3" />
                    </a>
                  </Button>
                );
              })}
            </div>
          </div>
          <div className="flex-1 flex flex-col md:flex-row gap-4">
            {/* Brand Section */}
            <div className="flex-1 flex flex-col gap-6">
              <Link href="/" className="flex flex-col gap-1 group">
                <h2 className="text-xl font-bold tracking-wider">
                  {STORE_CONFIG.name}
                </h2>
                <p className="text-xs text-muted-foreground -mt-0.5 tracking-wider">
                  {STORE_CONFIG.subtitle}
                </p>
              </Link>
              <div className="text-sm text-muted-foreground max-w-md leading-relaxed space-y-1">
                {STORE_CONFIG.description.map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
            </div>
            {/* Page Links and Contact Information */}
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
              {/* Page Links */}
              <div>
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <ExternalLink className="size-4 text-accent" />
                  快速連結
                </h3>
                <ul className="space-y-2">
                  {PAGE_LINKS.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href}>
                        <Button
                          variant="link"
                          className="h-auto p-0 text-muted-foreground hover:text-primary transition-colors"
                        >
                          {link.label}
                        </Button>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Contact Information */}
              <div>
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <MapPin className="size-4 text-accent" />
                  聯絡我們
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground/70" />
                    <span>{STORE_CONFIG.address}</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4 shrink-0 text-muted-foreground/70" />
                    <a
                      href={`mailto:${STORE_CONFIG.email}`}
                      className="hover:text-primary transition-colors"
                    >
                      {STORE_CONFIG.email}
                    </a>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4 shrink-0 text-muted-foreground/70" />
                    <span>{STORE_CONFIG.phone}</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 shrink-0 text-muted-foreground/70" />
                    <span>
                      {String(STORE_CONFIG.businessHours.open).padStart(2, "0")}
                      :00
                      {" - "}
                      {String(STORE_CONFIG.businessHours.close).padStart(
                        2,
                        "0"
                      )}
                      :00
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        {/* Bottom Section */}
        <div className="flex items-center justify-center select-none">
          {/* Copyright */}
          <p className="text-center text-sm text-muted-foreground">
            © {currentYear} {STORE_CONFIG.name}. {STORE_CONFIG.subtitle}
          </p>
        </div>
      </div>
    </footer>
  );
}
