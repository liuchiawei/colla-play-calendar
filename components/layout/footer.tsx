"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { STORE_CONFIG, QUICK_LINKS, SOCIAL_LINKS } from "@/lib/config";
import Link from "next/link";
import {
  MapPin,
  Mail,
  Phone,
  Clock,
  Instagram,
  Facebook,
  ExternalLink,
  Heart,
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
    <footer className="bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 py-12 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* ブランドセクション */}
          <div className="lg:col-span-2 flex flex-col justify-between gap-6">
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
            {/* ソーシャルリンク */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {SOCIAL_LINKS.map((social) => {
                const Icon = iconMap[social.icon];
                return (
                  <Button
                    key={social.label}
                    size="icon"
                    className="size-8"
                    asChild
                  >
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                    </a>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* クイックリンク */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-primary" />
              快速連結
            </h3>
            <ul className="space-y-2">
              {QUICK_LINKS.map((link) => (
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

          {/* 連絡先情報 */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
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
                  {String(STORE_CONFIG.businessHours.open).padStart(2, "0")}:00
                  {" - "}
                  {String(STORE_CONFIG.businessHours.close).padStart(2, "0")}:00
                </span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-4 bg-border/50" />

        {/* ボトムセクション */}
        <div className="flex items-center justify-center select-none">
          {/* 著作権表示 */}
          <p className="text-center text-sm text-muted-foreground">
            © {currentYear} {STORE_CONFIG.name}. {STORE_CONFIG.subtitle}
          </p>
        </div>
      </div>
    </footer>
  );
}
