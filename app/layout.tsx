import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Yamiko Главная 1920x1080",
  description: "YAMIKO Manga Platform",
};

import AuthProvider from "@/components/auth/AuthProvider";
import ErrorCapture from "@/components/ErrorCapture";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.className} bg-background-dark text-text-dark selection:bg-primary/30 min-h-screen flex flex-col group/app`}>
        <ErrorCapture />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
