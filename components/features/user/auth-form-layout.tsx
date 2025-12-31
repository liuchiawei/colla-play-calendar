"use client";

// 認証フォームの共通レイアウトコンポーネント
import { ReactNode } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AuthFormLayoutProps {
  title: string;
  description: string;
  error?: string | null;
  footerText: string;
  footerLinkText: string;
  footerLinkHref: string;
  children: ReactNode;
}

export function AuthFormLayout({
  title,
  description,
  error,
  footerText,
  footerLinkText,
  footerLinkHref,
  children,
}: AuthFormLayoutProps) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive mb-4">
            {error}
          </div>
        )}
        {children}
        <div className="mt-4 text-center text-sm">
          <span className="text-muted-foreground">{footerText}</span>{" "}
          <Link href={footerLinkHref} className="text-primary hover:underline">
            {footerLinkText}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
